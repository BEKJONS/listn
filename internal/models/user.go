package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"displayName"`
	RoleTitle    string    `json:"roleTitle"`
	GithubURL    string    `json:"githubUrl"`
	PortfolioURL string    `json:"portfolioUrl"`
	ExtraURL     string    `json:"extraUrl"`
	CustomURL    string    `json:"customUrl"`
	Views        int       `json:"views"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Track struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	IframeSrc string    `json:"iframeSrc"`
	CreatedAt time.Time `json:"createdAt"`
}

type UserLink struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"createdAt"`
}
