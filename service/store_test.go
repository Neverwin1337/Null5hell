package service

import (
	"bytes"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"nullshell/model"
)

func TestEncryptDecryptRoundTrip(t *testing.T) {
	dir := t.TempDir()
	st, err := openStoreInDir(dir)
	if err != nil {
		t.Fatalf("openStoreInDir: %v", err)
	}
	defer st.close()

	pw := "p@ssw0rd-secret"
	ciphertext, err := st.encryptPw(pw)
	if err != nil {
		t.Fatalf("encryptPw: %v", err)
	}
	if bytes.Contains(ciphertext, []byte(pw)) {
		t.Fatal("ciphertext must not contain plaintext")
	}
	got, err := st.decryptPw(ciphertext)
	if err != nil {
		t.Fatalf("decryptPw: %v", err)
	}
	if got != pw {
		t.Fatalf("decrypt mismatch: got %q want %q", got, pw)
	}
}

func TestCiphertextUniquePerCall(t *testing.T) {
	dir := t.TempDir()
	st, _ := openStoreInDir(dir)
	defer st.close()
	a, _ := st.encryptPw("same")
	b, _ := st.encryptPw("same")
	if bytes.Equal(a, b) {
		t.Fatal("encryption must be non-deterministic (random nonce)")
	}
}

func TestKeyPersistedAcrossOpen(t *testing.T) {
	dir := t.TempDir()
	st1, err := openStoreInDir(dir)
	if err != nil {
		t.Fatalf("first open: %v", err)
	}
	ciphertext, _ := st1.encryptPw("pw")
	st1.close()

	// 数据目录下已生成 secret.key
	if _, err := os.Stat(filepath.Join(dir, "secret.key")); err != nil {
		t.Fatalf("secret.key not created: %v", err)
	}

	st2, err := openStoreInDir(dir)
	if err != nil {
		t.Fatalf("second open: %v", err)
	}
	defer st2.close()
	got, err := st2.decryptPw(ciphertext)
	if err != nil {
		t.Fatalf("decrypt with reopened key: %v", err)
	}
	if got != "pw" {
		t.Fatalf("reopened key mismatch: got %q", got)
	}
}

func newTestServer(name string) model.Server {
	return model.Server{
		Type:      model.Password,
		Name:      name,
		IP:        "10.0.0.1",
		User:      "root",
		PW:        "pw-" + name,
		Comment:   "comment",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
}

func TestStoreCRUD(t *testing.T) {
	dir := t.TempDir()
	st, err := openStoreInDir(dir)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer st.close()

	created, err := st.createServer(newTestServer("srv1"))
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.ID <= 0 {
		t.Fatalf("expected positive ID, got %d", created.ID)
	}
	if created.PW != "pw-srv1" {
		t.Fatalf("created.PW should be plaintext, got %q", created.PW)
	}

	got, err := st.getServer(created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.PW != "pw-srv1" {
		t.Fatalf("decrypted PW mismatch: %q", got.PW)
	}

	list, err := st.listServers()
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 server, got %d", len(list))
	}

	upd := got
	upd.Name = "srv1-renamed"
	upd.Type = model.SSHKEY
	upd.PW = "new-secret"
	if err := st.updateServer(upd); err != nil {
		t.Fatalf("update: %v", err)
	}
	got2, _ := st.getServer(created.ID)
	if got2.Name != "srv1-renamed" || got2.Type != model.SSHKEY || got2.PW != "new-secret" {
		t.Fatalf("update not reflected: %+v", got2)
	}

	if err := st.deleteServer(created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := st.getServer(created.ID); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected ErrNoRows after delete, got %v", err)
	}
}

func TestStoreUpdateMissing(t *testing.T) {
	dir := t.TempDir()
	st, _ := openStoreInDir(dir)
	defer st.close()
	err := st.deleteServer(999)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows on delete missing, got %v", err)
	}
}

func TestLocalStorageServiceAPI(t *testing.T) {
	svc := NewLocalStorageService()
	dir := t.TempDir()
	st, err := openStoreInDir(dir)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	svc.store = st
	defer svc.close()

	created, err := svc.NewServer(0, "web", "1.2.3.4", "admin", "hunter2", "prod")
	if err != nil {
		t.Fatalf("NewServer: %v", err)
	}
	if created.PW != "hunter2" || created.ID <= 0 {
		t.Fatalf("unexpected created: %+v", created)
	}

	got, err := svc.GetServerByID(created.ID)
	if err != nil {
		t.Fatalf("GetServerByID: %v", err)
	}
	if got.PW != "hunter2" {
		t.Fatalf("PW should be plaintext via API, got %q", got.PW)
	}

	list, err := svc.GetServerList()
	if err != nil {
		t.Fatalf("GetServerList: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1, got %d", len(list))
	}

	if err := svc.UpdateServer(created.ID, 1, "web2", "1.2.3.5", "u", "new-pw", "updated"); err != nil {
		t.Fatalf("UpdateServer: %v", err)
	}
	got2, _ := svc.GetServerByID(created.ID)
	if got2.Name != "web2" || got2.PW != "new-pw" || got2.Type != model.SSHKEY {
		t.Fatalf("update not reflected: %+v", got2)
	}

	if err := svc.DeleteServer(created.ID); err != nil {
		t.Fatalf("DeleteServer: %v", err)
	}
	if _, err := svc.GetServerList(); err != nil {
		t.Fatalf("list after delete: %v", err)
	}
}

func TestLocalStorageServiceUninitialized(t *testing.T) {
	svc := NewLocalStorageService()
	if _, err := svc.GetServerList(); err == nil {
		t.Fatal("expected error when store not initialized")
	}
	if err := svc.DeleteServer(1); err == nil {
		t.Fatal("expected error when store not initialized")
	}
}
