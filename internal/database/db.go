package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func Connect(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
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
