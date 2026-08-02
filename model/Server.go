package model

type AuthMethod int

const (
	Password AuthMethod = iota
	SSHKEY
)

type Server struct {
	ID        int64
	Type      AuthMethod
	Name      string
	IP        string
	User      string
	PW        string
	Comment   string
	CreatedAt int64
	UpdatedAt int64
}
