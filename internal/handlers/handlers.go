package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"front_yandex_music/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	DB *sql.DB
}

func New(db *sql.DB) *Handler {
	return &Handler{DB: db}
}

// Helpers
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (h *Handler) getUserFromSession(r *http.Request) (*models.User, error) {
	cookie, err := r.Cookie("session_user_id")
	if err != nil {
		return nil, err
	}
	userID := cookie.Value
	row := h.DB.QueryRow("SELECT id, username, display_name, role_title, github_url, portfolio_url, extra_url, custom_url, views FROM users WHERE id = $1", userID)

	u := &models.User{}
	var displayName, roleTitle, githubURL, portfolioURL, extraURL, customURL sql.NullString

	err = row.Scan(&u.ID, &u.Username, &displayName, &roleTitle, &githubURL, &portfolioURL, &extraURL, &customURL, &u.Views)
	if err != nil {
		log.Println("User Scan Error:", err)
		return nil, err
	}

	// Convert NullString to regular string
	u.DisplayName = displayName.String
	u.RoleTitle = roleTitle.String
	u.GithubURL = githubURL.String
	u.PortfolioURL = portfolioURL.String
	u.ExtraURL = extraURL.String
	u.CustomURL = customURL.String

	return u, nil
}

// Handlers

func (h *Handler) HomeHandler(w http.ResponseWriter, r *http.Request) {
	user, _ := h.getUserFromSession(r)

	// Fetch Top Visited Users
	rows, err := h.DB.Query("SELECT id, username, display_name, role_title, custom_url, views FROM users WHERE views > 0 ORDER BY views DESC LIMIT 6")
	var topUsers []models.User
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var u models.User
			var displayName, roleTitle, customURL sql.NullString
			rows.Scan(&u.ID, &u.Username, &displayName, &roleTitle, &customURL, &u.Views)
			u.DisplayName = displayName.String
			u.RoleTitle = roleTitle.String
			u.CustomURL = customURL.String
			if u.DisplayName == "" {
				u.DisplayName = u.Username
			}
			topUsers = append(topUsers, u)
		}
	}

	// Fetch Similar Listeners if logged in
	var similarUsers []models.User
	if user != nil {
		sRows, err := h.DB.Query(`
			SELECT DISTINCT u.id, u.username, u.display_name, u.custom_url 
			FROM users u 
			JOIN tracks t ON u.id = t.user_id 
			WHERE t.iframe_src IN (SELECT iframe_src FROM tracks WHERE user_id = $1) 
			AND u.id != $1 
			LIMIT 6`, user.ID)
		if err == nil {
			defer sRows.Close()
			for sRows.Next() {
				var u models.User
				var displayName, customURL sql.NullString
				sRows.Scan(&u.ID, &u.Username, &displayName, &customURL)
				u.DisplayName = displayName.String
				u.CustomURL = customURL.String
				if u.DisplayName == "" {
					u.DisplayName = u.Username
				}
				similarUsers = append(similarUsers, u)
			}
		}
	}

	tmpl := template.Must(template.ParseFiles("web/templates/index.html"))
	tmpl.Execute(w, map[string]interface{}{
		"User":         user,
		"TopUsers":     topUsers,
		"SimilarUsers": similarUsers,
	})
}

func (h *Handler) SearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.FormValue("q")
	if query == "" {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	// Direct redirect to profile if it exists (by custom_url or username)
	http.Redirect(w, r, "/u/"+query, http.StatusFound)
}

func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		username := r.FormValue("username")
		password := r.FormValue("password")

		var id int
		var hash string
		err := h.DB.QueryRow("SELECT id, password_hash FROM users WHERE username=$1", username).Scan(&id, &hash)
		if err != nil || !checkPasswordHash(password, hash) {
			tmpl := template.Must(template.ParseFiles("web/templates/login.html"))
			tmpl.Execute(w, map[string]interface{}{"Error": "Invalid credentials"})
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:    "session_user_id",
			Value:   fmt.Sprintf("%d", id),
			Expires: time.Now().Add(24 * time.Hour),
			Path:    "/",
		})
		http.Redirect(w, r, "/dashboard", http.StatusFound)
		return
	}
	tmpl := template.Must(template.ParseFiles("web/templates/login.html"))
	tmpl.Execute(w, nil)
}

func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		username := r.FormValue("username")
		password := r.FormValue("password")

		hash, _ := hashPassword(password)
		_, err := h.DB.Exec("INSERT INTO users (username, password_hash) VALUES ($1, $2)", username, hash)
		if err != nil {
			log.Println("Registration Error:", err)
			tmpl := template.Must(template.ParseFiles("web/templates/login.html"))
			errorMessage := "Username already exists or error occurred"
			if strings.Contains(err.Error(), "users_username_key") {
				errorMessage = "Username is already taken"
			}
			tmpl.Execute(w, map[string]interface{}{
				"IsRegister": true,
				"Error":      errorMessage,
			})
			return
		}
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	tmpl := template.Must(template.ParseFiles("web/templates/login.html"))
	tmpl.Execute(w, map[string]interface{}{"IsRegister": true})
}

func (h *Handler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:    "session_user_id",
		Value:   "",
		Expires: time.Now().Add(-1 * time.Hour),
		Path:    "/",
	})
	http.Redirect(w, r, "/login", http.StatusFound)
}

func (h *Handler) DashboardHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	rows, err := h.DB.Query("SELECT id, iframe_src FROM tracks WHERE user_id = $1 ORDER BY id DESC", user.ID)
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()

	var tracks []models.Track
	for rows.Next() {
		var t models.Track
		rows.Scan(&t.ID, &t.IframeSrc)
		tracks = append(tracks, t)
	}

	tmpl := template.Must(template.ParseFiles("web/templates/dashboard.html"))
	tmpl.Execute(w, map[string]interface{}{
		"User":   user,
		"Tracks": tracks,
	})
}

func (h *Handler) UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}
	if r.Method == "POST" {
		displayName := r.FormValue("display_name")
		roleTitle := r.FormValue("role_title")
		customURL := strings.TrimSpace(r.FormValue("custom_url"))

		// Validate input (simplified - no longer checking old URL fields)
		if err := validateProfileInput(displayName, roleTitle, "", "", "", customURL); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Check if custom URL is already taken (by someone else)
		if customURL != "" && customURL != user.CustomURL {
			var existingID int
			err := h.DB.QueryRow("SELECT id FROM users WHERE custom_url = $1", customURL).Scan(&existingID)
			if err == nil {
				http.Error(w, "This custom URL is already taken", http.StatusBadRequest)
				return
			}
		}

		_, err := h.DB.Exec(
			"UPDATE users SET display_name=$1, role_title=$2, custom_url=$3 WHERE id=$4",
			displayName, roleTitle, customURL, user.ID,
		)
		if err != nil {
			log.Println("Update error:", err)
		}
	}
	http.Redirect(w, r, "/dashboard", http.StatusFound)
}

// parseYandexLink converts various inputs into the valid iframe SRC
// Input can be:
// 1. https://music.yandex.ru/album/35411305/track/136144546...
// 2. <iframe ... src="https://music.yandex.ru/iframe/album/35411305/track/136144546">...
// Output: https://music.yandex.ru/iframe/album/35411305/track/136144546
func parseYandexLink(input string) string {
	// If it's already an iframe tag, extract the src
	if strings.Contains(input, "<iframe") {
		re := regexp.MustCompile(`src="(https://music\.yandex\.ru/iframe/album/\d+/track/\d+)"`)
		matches := re.FindStringSubmatch(input)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	// If it's a direct link
	// https://music.yandex.ru/album/35411305/track/136144546
	re := regexp.MustCompile(`music\.yandex\.ru/album/(\d+)/track/(\d+)`)
	matches := re.FindStringSubmatch(input)
	if len(matches) > 2 {
		albumID := matches[1]
		trackID := matches[2]
		return fmt.Sprintf("https://music.yandex.ru/iframe/album/%s/track/%s", albumID, trackID)
	}

	return ""
}

func (h *Handler) AddTrackHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	if r.Method == "POST" {
		input := r.FormValue("track_input")
		iframeSrc := parseYandexLink(input)
		if iframeSrc != "" {
			h.DB.Exec("INSERT INTO tracks (user_id, iframe_src) VALUES ($1, $2)", user.ID, iframeSrc)
		}
	}
	http.Redirect(w, r, "/dashboard", http.StatusFound)
}

func (h *Handler) PublicProfileHandler(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/u/")

	// Query for user where either custom_url matches OR username matches
	row := h.DB.QueryRow("SELECT id, username, display_name, role_title, github_url, portfolio_url, extra_url, custom_url, views FROM users WHERE custom_url = $1 OR username = $1", slug)

	u := &models.User{}
	var displayName, roleTitle, githubURL, portfolioURL, extraURL, customURL sql.NullString

	err := row.Scan(&u.ID, &u.Username, &displayName, &roleTitle, &githubURL, &portfolioURL, &extraURL, &customURL, &u.Views)
	if err != nil {
		// User not found
		w.WriteHeader(http.StatusNotFound)
		tmpl := template.Must(template.ParseFiles("web/templates/404.html"))
		tmpl.Execute(w, nil)
		return
	}

	// Convert NullString to strings
	u.CustomURL = customURL.String

	// PRIVACY CHECK:
	if u.CustomURL != "" && slug != u.CustomURL {
		// User has a custom URL, but tried to access via username
		w.WriteHeader(http.StatusNotFound)
		tmpl := template.Must(template.ParseFiles("web/templates/404.html"))
		tmpl.Execute(w, nil)
		return
	}

	u.DisplayName = displayName.String
	u.RoleTitle = roleTitle.String
	u.GithubURL = githubURL.String
	u.PortfolioURL = portfolioURL.String
	u.ExtraURL = extraURL.String

	// Defaults if empty
	if u.DisplayName == "" {
		u.DisplayName = u.Username
	}
	if u.RoleTitle == "" {
		u.RoleTitle = "Music Lover"
	}

	// Check if the logged-in user is viewing their own profile
	isOwner := false
	loggedInUser, err := h.getUserFromSession(r)
	if err == nil && loggedInUser.ID == u.ID {
		isOwner = true
	}

	// Increment views only if NOT the owner
	if !isOwner {
		h.DB.Exec("UPDATE users SET views = views + 1 WHERE id = $1", u.ID)
		u.Views++
	}

	rows, err := h.DB.Query("SELECT id, iframe_src FROM tracks WHERE user_id = $1 ORDER BY id DESC", u.ID)
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()

	var tracks []models.Track
	for rows.Next() {
		var t models.Track
		rows.Scan(&t.ID, &t.IframeSrc)
		tracks = append(tracks, t)
	}

	tmpl := template.Must(template.ParseFiles("web/templates/profile.html"))
	tmpl.Execute(w, map[string]interface{}{
		"User":    u,
		"Tracks":  tracks,
		"IsOwner": isOwner,
	})
}

// JSON API Handlers

func (h *Handler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Println("JSON Encode Error:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *Handler) APIMeHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		h.sendJSON(w, map[string]interface{}{"error": "Unauthorized"})
		return
	}

	rows, err := h.DB.Query("SELECT id, iframe_src FROM tracks WHERE user_id = $1 ORDER BY id DESC", user.ID)
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()

	var tracks []models.Track
	for rows.Next() {
		var t models.Track
		rows.Scan(&t.ID, &t.IframeSrc)
		tracks = append(tracks, t)
	}

	// Fetch user links
	linkRows, err := h.DB.Query("SELECT id, name, url FROM user_links WHERE user_id = $1 ORDER BY id ASC", user.ID)
	if err != nil {
		log.Println(err)
	}
	defer linkRows.Close()

	var links []models.UserLink
	for linkRows.Next() {
		var l models.UserLink
		linkRows.Scan(&l.ID, &l.Name, &l.URL)
		l.UserID = user.ID
		links = append(links, l)
	}

	h.sendJSON(w, map[string]interface{}{
		"user":   user,
		"tracks": tracks,
		"links":  links,
	})
}

func (h *Handler) APITopProfilesHandler(w http.ResponseWriter, r *http.Request) {
	// Show all users, ordered by views, then ID
	rows, err := h.DB.Query("SELECT id, username, display_name, role_title, custom_url, views FROM users ORDER BY views DESC, id DESC LIMIT 6")
	var topUsers []models.User
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var u models.User
			var displayName, roleTitle, customURL sql.NullString
			rows.Scan(&u.ID, &u.Username, &displayName, &roleTitle, &customURL, &u.Views)
			u.DisplayName = displayName.String
			u.RoleTitle = roleTitle.String
			u.CustomURL = customURL.String
			if u.DisplayName == "" {
				u.DisplayName = u.Username
			}
			topUsers = append(topUsers, u)
		}
	}
	h.sendJSON(w, topUsers)
}

func (h *Handler) APISimilarListenersHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		h.sendJSON(w, []models.User{})
		return
	}

	sRows, err := h.DB.Query(`
		SELECT DISTINCT u.id, u.username, u.display_name, u.custom_url 
		FROM users u 
		JOIN tracks t ON u.id = t.user_id 
		WHERE t.iframe_src IN (SELECT iframe_src FROM tracks WHERE user_id = $1) 
		AND u.id != $1 
		LIMIT 6`, user.ID)

	var similarUsers []models.User
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var u models.User
			var displayName, customURL sql.NullString
			sRows.Scan(&u.ID, &u.Username, &displayName, &customURL)
			u.DisplayName = displayName.String
			u.CustomURL = customURL.String
			if u.DisplayName == "" {
				u.DisplayName = u.Username
			}
			similarUsers = append(similarUsers, u)
		}
	}
	h.sendJSON(w, similarUsers)
}

func (h *Handler) APIPublicProfileHandler(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/profile/")

	row := h.DB.QueryRow("SELECT id, username, display_name, role_title, github_url, portfolio_url, extra_url, custom_url, views FROM users WHERE custom_url = $1 OR username = $1", slug)

	u := &models.User{}
	var displayName, roleTitle, githubURL, portfolioURL, extraURL, customURL sql.NullString

	err := row.Scan(&u.ID, &u.Username, &displayName, &roleTitle, &githubURL, &portfolioURL, &extraURL, &customURL, &u.Views)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	u.CustomURL = customURL.String
	if u.CustomURL != "" && slug != u.CustomURL && slug != u.Username {
		// If accessing via username when custom URL exists, check if slug is username
		if slug == u.Username {
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
	}

	u.DisplayName = displayName.String
	u.RoleTitle = roleTitle.String
	u.GithubURL = githubURL.String
	u.PortfolioURL = portfolioURL.String
	u.ExtraURL = extraURL.String

	if u.DisplayName == "" {
		u.DisplayName = u.Username
	}

	// View Counting Logic
	isOwner := false
	loggedInUser, err := h.getUserFromSession(r)
	if err == nil && loggedInUser.ID == u.ID {
		isOwner = true
	}

	if !isOwner {
		h.DB.Exec("UPDATE users SET views = views + 1 WHERE id = $1", u.ID)
		u.Views++
	}

	rows, err := h.DB.Query("SELECT id, iframe_src FROM tracks WHERE user_id = $1 ORDER BY id DESC", u.ID)
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()

	var tracks []models.Track
	for rows.Next() {
		var t models.Track
		rows.Scan(&t.ID, &t.IframeSrc)
		tracks = append(tracks, t)
	}

	// Fetch user links
	linkRows, err := h.DB.Query("SELECT id, name, url FROM user_links WHERE user_id = $1 ORDER BY id ASC", u.ID)
	if err != nil {
		log.Println(err)
	}
	defer linkRows.Close()

	var links []models.UserLink
	for linkRows.Next() {
		var l models.UserLink
		linkRows.Scan(&l.ID, &l.Name, &l.URL)
		l.UserID = u.ID
		links = append(links, l)
	}

	h.sendJSON(w, map[string]interface{}{
		"user":   u,
		"tracks": tracks,
		"links":  links,
	})
}

func (h *Handler) APIAddLinkHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := strings.TrimSpace(r.FormValue("name"))
	url := strings.TrimSpace(r.FormValue("url"))

	if name == "" || url == "" {
		http.Error(w, "Name and URL are required", http.StatusBadRequest)
		return
	}

	// Basic URL validation
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Check for adult content
	if containsAdultContent(url) {
		http.Error(w, "URL contains inappropriate content", http.StatusBadRequest)
		return
	}

	_, err = h.DB.Exec("INSERT INTO user_links (user_id, name, url) VALUES ($1, $2, $3)", user.ID, name, url)
	if err != nil {
		log.Println("Error adding link:", err)
		http.Error(w, "Failed to add link", http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{"success": true})
}

func (h *Handler) APIRemoveLinkHandler(w http.ResponseWriter, r *http.Request) {
	user, err := h.getUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	linkID := r.FormValue("id")
	if linkID == "" {
		http.Error(w, "Link ID is required", http.StatusBadRequest)
		return
	}

	// Verify the link belongs to the user
	var ownerID int
	err = h.DB.QueryRow("SELECT user_id FROM user_links WHERE id = $1", linkID).Scan(&ownerID)
	if err != nil {
		http.Error(w, "Link not found", http.StatusNotFound)
		return
	}

	if ownerID != user.ID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	_, err = h.DB.Exec("DELETE FROM user_links WHERE id = $1", linkID)
	if err != nil {
		log.Println("Error removing link:", err)
		http.Error(w, "Failed to remove link", http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{"success": true})
}
