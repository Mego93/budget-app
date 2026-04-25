package middleware

import (
	"context"
	"net/http"
	"strings"

	"budget-backend/internal/auth"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			claims, err := auth.VerifyToken(strings.TrimPrefix(header, "Bearer "), jwtSecret)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetClaims(r *http.Request) *auth.Claims {
	v := r.Context().Value(ClaimsKey)
	if v == nil {
		return nil
	}
	return v.(*auth.Claims)
}
