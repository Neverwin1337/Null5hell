package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"nullshell/model"

	_ "modernc.org/sqlite"
)

var ErrNotFound = errors.New("server not found")

func dataDir() (string, error) {
	cfg, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cfg, "nullshell"), nil
}

type store struct {
	db  *sql.DB
	key []byte
}

func openStoreInDir(dir string) (*store, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	key, err := loadOrCreateKey(filepath.Join(dir, "secret.key"))
	if err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", filepath.Join(dir, "nullshell.db"))
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS servers (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		type       INTEGER NOT NULL,
		name       TEXT    NOT NULL,
		ip         TEXT    NOT NULL,
		user       TEXT    NOT NULL,
		pw         BLOB    NOT NULL,
		comment    TEXT,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	)`); err != nil {
		db.Close()
		return nil, err
	}
	return &store{db: db, key: key}, nil
}

func (s *store) close() error {
	return s.db.Close()
}

func loadOrCreateKey(path string) ([]byte, error) {
	key, err := os.ReadFile(path)
	if err == nil && len(key) == 32 {
		return key, nil
	}
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	if err == nil {
		return nil, fmt.Errorf("key file %s must be exactly 32 bytes, got %d; refusing to overwrite", path, len(key))
	}
	key = make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return nil, err
	}
	if err := os.WriteFile(path, key, 0o600); err != nil {
		return nil, err
	}
	return key, nil
}

func (s *store) encryptPw(pw string) ([]byte, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, []byte(pw), nil), nil
}

func (s *store) decryptPw(data []byte) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(data) < gcm.NonceSize() {
		return "", errors.New("ciphertext too short")
	}
	nonce := data[:gcm.NonceSize()]
	ciphertext := data[gcm.NonceSize():]
	plain, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func (s *store) createServer(server model.Server) (model.Server, error) {
	enc, err := s.encryptPw(server.PW)
	if err != nil {
		return model.Server{}, err
	}
	now := time.Now().Unix()
	if server.CreatedAt == 0 {
		server.CreatedAt = now
	}
	if server.UpdatedAt == 0 {
		server.UpdatedAt = now
	}
	res, err := s.db.Exec(`INSERT INTO servers (type, name, ip, user, pw, comment, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		int(server.Type), server.Name, server.IP, server.User, enc, server.Comment, server.CreatedAt, server.UpdatedAt)
	if err != nil {
		return model.Server{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return model.Server{}, err
	}
	server.ID = id
	return server, nil
}

func (s *store) listServers() ([]model.Server, error) {
	rows, err := s.db.Query(`SELECT id, type, name, ip, user, pw, comment, created_at, updated_at FROM servers ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]model.Server, 0)
	for rows.Next() {
		var sv model.Server
		var enc []byte
		if err := rows.Scan(&sv.ID, &sv.Type, &sv.Name, &sv.IP, &sv.User, &enc, &sv.Comment, &sv.CreatedAt, &sv.UpdatedAt); err != nil {
			return nil, err
		}
		pw, err := s.decryptPw(enc)
		if err != nil {
			return nil, err
		}
		sv.PW = pw
		result = append(result, sv)
	}
	return result, rows.Err()
}

func (s *store) getServer(id int64) (model.Server, error) {
	var sv model.Server
	var enc []byte
	err := s.db.QueryRow(`SELECT id, type, name, ip, user, pw, comment, created_at, updated_at FROM servers WHERE id = ?`, id).
		Scan(&sv.ID, &sv.Type, &sv.Name, &sv.IP, &sv.User, &enc, &sv.Comment, &sv.CreatedAt, &sv.UpdatedAt)
	if err != nil {
		return model.Server{}, err
	}
	pw, err := s.decryptPw(enc)
	if err != nil {
		return model.Server{}, err
	}
	sv.PW = pw
	return sv, nil
}

func (s *store) updateServer(server model.Server) error {
	enc, err := s.encryptPw(server.PW)
	if err != nil {
		return err
	}
	res, err := s.db.Exec(`UPDATE servers SET type = ?, name = ?, ip = ?, user = ?, pw = ?, comment = ?, updated_at = ? WHERE id = ?`,
		int(server.Type), server.Name, server.IP, server.User, enc, server.Comment, time.Now().Unix(), server.ID)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *store) deleteServer(id int64) error {
	res, err := s.db.Exec(`DELETE FROM servers WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}
