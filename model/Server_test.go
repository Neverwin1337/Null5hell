package model

import "testing"

func TestServerFields(t *testing.T) {
	s := Server{ID: 1, Type: SSHKEY, Name: "n", IP: "1.2.3.4", User: "u", Comment: "c", CreatedAt: 100, UpdatedAt: 200}
	if s.ID != 1 || s.Type != SSHKEY || s.CreatedAt != 100 || s.UpdatedAt != 200 {
		t.Fatalf("unexpected Server: %+v", s)
	}
}
