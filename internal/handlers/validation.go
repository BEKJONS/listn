package handlers

import (
	"regexp"
	"strings"
)

// List of prohibited words and patterns
var profanityList = []string{
	"fuck", "shit", "bitch", "ass", "damn", "crap", "piss", "dick", "cock",
	"pussy", "cunt", "bastard", "slut", "whore", "fag", "nigger", "retard",
}

var adultSites = []string{
	"pornhub", "xvideos", "xnxx", "redtube", "youporn", "porn", "xxx",
	"onlyfans", "chaturbate", "stripchat", "cam4", "livejasmin",
}

// containsProfanity checks if text contains profanity
func containsProfanity(text string) bool {
	lowerText := strings.ToLower(text)
	for _, word := range profanityList {
		if strings.Contains(lowerText, word) {
			return true
		}
	}
	return false
}

// containsAdultContent checks if URL contains adult content
func containsAdultContent(url string) bool {
	lowerURL := strings.ToLower(url)
	for _, site := range adultSites {
		if strings.Contains(lowerURL, site) {
			return true
		}
	}
	return false
}

// validateProfileInput validates all profile inputs
func validateProfileInput(displayName, roleTitle, githubURL, portfolioURL, extraURL, customURL string) error {
	// Check display name and role for profanity
	if containsProfanity(displayName) {
		return &ValidationError{"Display name contains inappropriate content"}
	}
	if containsProfanity(roleTitle) {
		return &ValidationError{"Role/title contains inappropriate content"}
	}

	// Check URLs for adult content
	if containsAdultContent(githubURL) {
		return &ValidationError{"GitHub URL contains inappropriate content"}
	}
	if containsAdultContent(portfolioURL) {
		return &ValidationError{"Portfolio URL contains inappropriate content"}
	}
	if containsAdultContent(extraURL) {
		return &ValidationError{"Extra URL contains inappropriate content"}
	}

	// Validate custom URL format (alphanumeric, hyphens, underscores only)
	if customURL != "" {
		matched, _ := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, customURL)
		if !matched {
			return &ValidationError{"Custom URL can only contain letters, numbers, hyphens, and underscores"}
		}
		if len(customURL) < 3 || len(customURL) > 30 {
			return &ValidationError{"Custom URL must be between 3 and 30 characters"}
		}
	}

	return nil
}

// ValidationError represents a validation error
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
