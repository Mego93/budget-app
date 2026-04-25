package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"budget-backend/internal/db"
	"budget-backend/internal/handlers"
	"budget-backend/internal/middleware"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg := mustConfig()

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := db.Migrate(context.Background(), pool); err != nil {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(requestLogger)
	r.Use(chimw.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	authHandler := handlers.NewAuthHandler(pool, cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.JWTSecret, cfg.FrontendURL)
	r.Get("/auth/google", authHandler.Redirect)
	r.Get("/auth/google/callback", authHandler.Callback)
	r.Post("/auth/logout", authHandler.Logout)

	budgetHandler := handlers.NewBudgetHandler(pool)
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.RequireAuth(cfg.JWTSecret))
		r.Get("/me", authHandler.Me)
		r.Get("/budget", budgetHandler.Get)
		r.Put("/budget", budgetHandler.Put)
	})

	addr := ":" + cfg.Port
	slog.Info("listening", "addr", addr)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", chimw.GetReqID(r.Context()),
		)
	})
}
