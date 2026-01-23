# Yandex Music Profile App

A personal music landing page where users can showcase what they're listening to right now.

## Features
- User registration and login
- Personal profile with customizable name, role, and social links
- Add multiple Yandex Music tracks
- Beautiful dark-themed carousel interface
- Public profile pages at `/u/{username}`

## Quick Start

### 1. Start PostgreSQL Database
```bash
docker-compose up -d db
```

Wait 5 seconds for the database to be ready.

### 2. Build and Run the Server
```bash
go build -o server cmd/server/main.go
./server
```

The server will start on http://localhost:8080

### 3. Use the App

1. **Register**: Go to http://localhost:8080/register
   - Create username and password
   
2. **Login**: After registration, login at http://localhost:8080/login

3. **Dashboard**: Update your profile info:
   - Display Name (shown on your public page)
   - Role/Title (e.g., "Backend Developer")
   - GitHub URL
   - Portfolio URL
   - Extra Link

4. **Add Music**: Paste either:
   - Yandex Music track URL: `https://music.yandex.ru/album/35411305/track/136144546`
   - Or the full iframe code from Yandex Music

5. **View Public Profile**: Click "View Public Profile" or go to `/u/your-username`

## Project Structure
```
.
├── cmd/server/main.go          # Entry point
├── internal/
│   ├── database/db.go          # Database connection
│   ├── handlers/handlers.go    # HTTP handlers
│   └── models/user.go          # Data models
├── web/
│   ├── static/
│   │   ├── css/style.css       # Styles
│   │   └── js/script.js        # Carousel logic
│   └── templates/
│       ├── login.html          # Login/Register page
│       ├── dashboard.html      # User dashboard
│       └── profile.html        # Public profile
├── docker-compose.yml          # PostgreSQL setup
└── Dockerfile                  # App containerization
```

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (default: `postgres://postgres:postgrespassword@localhost:5432/yandex_music_app?sslmode=disable`)
- `PORT`: Server port (default: `8080`)

## Docker Deployment
```bash
docker-compose up --build
```

This will start both the database and the application.
# listn
