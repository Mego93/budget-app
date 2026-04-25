package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"budget-backend/internal/auth"
	"budget-backend/internal/middleware"
)

type AuthHandler struct {
	pool        *pgxpool.Pool
	oauthCfg    *oauth2.Config
	jwtSecret   string
	frontendURL string
	prod        bool
}

func NewAuthHandler(pool *pgxpool.Pool, clientID, clientSecret, jwtSecret, frontendURL string, prod bool) *AuthHandler {
	return &AuthHandler{
		pool:        pool,
		jwtSecret:   jwtSecret,
		frontendURL: frontendURL,
		prod:        prod,
		oauthCfg: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
	}
}

func (h *AuthHandler) Redirect(w http.ResponseWriter, r *http.Request) {
	cfg := h.configWithRedirect(r)
	state := randomState()
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   600,
		HttpOnly: true,
		Secure:   h.prod,
		SameSite: http.SameSiteStrictMode,
	})
	http.Redirect(w, r, cfg.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("oauth_state")
	if err != nil || cookie.Value != r.URL.Query().Get("state") {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "oauth_state", MaxAge: -1, Path: "/"})

	cfg := h.configWithRedirect(r)
	oauthToken, err := cfg.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		slog.Error("oauth exchange failed", "err", err)
		http.Error(w, "auth failed", http.StatusInternalServerError)
		return
	}

	profile, err := fetchGoogleProfile(r.Context(), cfg, oauthToken)
	if err != nil {
		slog.Error("fetch profile failed", "err", err)
		http.Error(w, "auth failed", http.StatusInternalServerError)
		return
	}

	userID, err := h.upsertUser(r.Context(), profile)
	if err != nil {
		slog.Error("upsert user failed", "err", err)
		http.Error(w, "auth failed", http.StatusInternalServerError)
		return
	}

	jwt, err := auth.IssueToken(userID, profile.Email, profile.Name, h.jwtSecret)
	if err != nil {
		http.Error(w, "auth failed", http.StatusInternalServerError)
		return
	}

	// Deliver JWT via a short-lived one-time code in the query string
	// to avoid exposing the token in browser history or Referer headers.
	code := auth.StoreCode(jwt)
	http.Redirect(w, r, h.frontendURL+"?auth_code="+code, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) Exchange(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Code == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	jwt, ok := auth.ConsumeCode(body.Code)
	if !ok {
		http.Error(w, "invalid or expired code", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": jwt})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"id":    claims.UserID,
		"email": claims.Email,
		"name":  claims.Name,
	})
}

type googleProfile struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func fetchGoogleProfile(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) (*googleProfile, error) {
	client := cfg.Client(ctx, token)
	resp, err := client.Get("https://openidconnect.googleapis.com/v1/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var p googleProfile
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (h *AuthHandler) upsertUser(ctx context.Context, p *googleProfile) (string, error) {
	var id string
	err := h.pool.QueryRow(ctx, `
		INSERT INTO users (google_id, email, name)
		VALUES ($1, $2, $3)
		ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
		RETURNING id
	`, p.Sub, p.Email, p.Name).Scan(&id)
	return id, err
}

func (h *AuthHandler) configWithRedirect(r *http.Request) *oauth2.Config {
	scheme := "https"
	if r.TLS == nil && r.Header.Get("X-Forwarded-Proto") != "https" {
		scheme = "http"
	}
	cfg := *h.oauthCfg
	cfg.RedirectURL = fmt.Sprintf("%s://%s/auth/google/callback", scheme, r.Host)
	return &cfg
}

func randomState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
