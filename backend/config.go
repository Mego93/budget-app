package main

import (
	"fmt"
	"os"
)

type config struct {
	Port               string
	DatabaseURL        string
	GoogleClientID     string
	GoogleClientSecret string
	JWTSecret          string
	FrontendURL        string
	Prod               bool
}

func mustConfig() config {
	return config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		GoogleClientID:     requireEnv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
		JWTSecret:          requireEnv("JWT_SECRET"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		Prod:               os.Getenv("ENVIRONMENT") == "production",
	}
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required env var %s is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
