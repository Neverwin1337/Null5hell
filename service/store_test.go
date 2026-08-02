package service

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
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
