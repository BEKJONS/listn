package main

import (
	"log"
	"net/http"
	"os"

	"front_yandex_music/internal/database"
	"front_yandex_music/internal/handlers"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists (for local development only)
	_ = godotenv.Load()

	// Get DATABASE_URL from environment (required for Railway)
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Normalize connection string: Railway uses postgresql://, lib/pq accepts both
	// but we'll normalize to postgres:// for consistency
	if len(dbUrl) > 12 && dbUrl[:12] == "postgresql://" {
		dbUrl = "postgres://" + dbUrl[12:]
	}

	log.Println("Connecting to database...")
	db, err := database.Connect(dbUrl)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	// Init Handlers
	h := handlers.New(db)

	// Router
	mux := http.NewServeMux()

	// Static files for built React app
	mux.Handle("/assets/", http.FileServer(http.Dir("front-end/dist")))

	// API Routes
	mux.HandleFunc("/api/me", h.APIMeHandler)
	mux.HandleFunc("/api/top_profiles", h.APITopProfilesHandler)
	mux.HandleFunc("/api/similar_listeners", h.APISimilarListenersHandler)
	mux.HandleFunc("/api/profile/", h.APIPublicProfileHandler)

	// Legacy / API actions (already existing)
	mux.HandleFunc("/api/add_track", h.AddTrackHandler)
	mux.HandleFunc("/api/update_profile", h.UpdateProfileHandler)
	mux.HandleFunc("/api/add_link", h.APIAddLinkHandler)
	mux.HandleFunc("/api/remove_link", h.APIRemoveLinkHandler)

	// Auth (Keep for now, but API might want JSON ones too)
	mux.HandleFunc("/login", h.LoginHandler)
	mux.HandleFunc("/register", h.RegisterHandler)
	mux.HandleFunc("/logout", h.LogoutHandler)

	// SPA Catch-all
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If it's a file that exists, serve it
		path := "front-end/dist" + r.URL.Path
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			http.FileServer(http.Dir("front-end/dist")).ServeHTTP(w, r)
			return
		}
		// Otherwise serve index.html
		http.ServeFile(w, r, "front-end/dist/index.html")
	})

	// Get PORT from environment (Railway sets this automatically)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
