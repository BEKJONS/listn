package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

func Connect(connStr string) (*sql.DB, error) {
	if connStr == "" {
		return nil, fmt.Errorf("database connection string is empty")
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Retry connection with exponential backoff (for Railway/cloud deployments)
	// Railway databases may take a few seconds to be ready
	maxRetries := 15
	initialDelay := 2 * time.Second
	retryDelay := initialDelay

	for i := 0; i < maxRetries; i++ {
		if err := db.Ping(); err != nil {
			if i < maxRetries-1 {
				fmt.Printf("Database connection attempt %d/%d failed: %v\n", i+1, maxRetries, err)
				fmt.Printf("Retrying in %v...\n", retryDelay)
				time.Sleep(retryDelay)
				// Exponential backoff with max cap of 10 seconds
				retryDelay *= 2
				if retryDelay > 10*time.Second {
					retryDelay = 10 * time.Second
				}
				continue
			}
			return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
		}
		// Connection successful
		break
	}

	if err := createTables(db); err != nil {
		return nil, err
	}

	fmt.Println("Connected to Database and tables ensured")
	return db, nil
}

func createTables(db *sql.DB) error {
	queryErrors := []string{}

	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		display_name TEXT,
		role_title TEXT,
		github_url TEXT,
		portfolio_url TEXT,
		extra_url TEXT,
		custom_url TEXT UNIQUE,
		views INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	tracksTable := `
	CREATE TABLE IF NOT EXISTS tracks (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id),
		iframe_src TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	userLinksTable := `
	CREATE TABLE IF NOT EXISTS user_links (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		url TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := db.Exec(usersTable); err != nil {
		queryErrors = append(queryErrors, err.Error())
	}
	if _, err := db.Exec(tracksTable); err != nil {
		queryErrors = append(queryErrors, err.Error())
	}
	if _, err := db.Exec(userLinksTable); err != nil {
		queryErrors = append(queryErrors, err.Error())
	}

	if len(queryErrors) > 0 {
		return fmt.Errorf("tables init error: %v", queryErrors)
	}
	return nil
}
