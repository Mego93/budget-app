package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"budget-backend/internal/middleware"
)

type BudgetHandler struct {
	pool *pgxpool.Pool
}

func NewBudgetHandler(pool *pgxpool.Pool) *BudgetHandler {
	return &BudgetHandler{pool: pool}
}

func (h *BudgetHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	var data json.RawMessage
	err := h.pool.QueryRow(r.Context(), `
		SELECT data FROM budgets WHERE user_id = $1
	`, claims.UserID).Scan(&data)

	if err != nil {
		// No budget yet — return empty object
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("{}"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (h *BudgetHandler) Put(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1MB max
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if !json.Valid(body) {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	_, err = h.pool.Exec(r.Context(), `
		INSERT INTO budgets (user_id, data, updated_at)
		VALUES ($1, $2, now())
		ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
	`, claims.UserID, body)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
