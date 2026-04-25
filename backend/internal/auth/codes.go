package auth

import (
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"
)

type codeEntry struct {
	token     string
	expiresAt time.Time
}

var (
	codeMu sync.Mutex
	codes  = make(map[string]codeEntry)
)

func StoreCode(token string) string {
	b := make([]byte, 16)
	rand.Read(b)
	code := base64.URLEncoding.EncodeToString(b)
	codeMu.Lock()
	codes[code] = codeEntry{token: token, expiresAt: time.Now().Add(30 * time.Second)}
	codeMu.Unlock()
	return code
}

func ConsumeCode(code string) (string, bool) {
	codeMu.Lock()
	defer codeMu.Unlock()
	entry, ok := codes[code]
	if !ok || time.Now().After(entry.expiresAt) {
		delete(codes, code)
		return "", false
	}
	delete(codes, code)
	return entry.token, true
}
