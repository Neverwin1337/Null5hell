package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"wails3-app/model"
)

type LocalStorageService struct {
	store *store
}

func NewLocalStorageService() *LocalStorageService {
	return &LocalStorageService{}
}

func (s *LocalStorageService) ServiceStartup(ctx context.Context) error {
	dir, err := dataDir()
	if err != nil {
		return err
	}
	st, err := openStoreInDir(dir)
	if err != nil {
		return err
	}
	s.store = st
	return nil
}

func (s *LocalStorageService) ServiceShutdown(ctx context.Context) error {
	return s.close()
}

func (s *LocalStorageService) close() error {
	if s.store == nil {
		return nil
	}
	return s.store.close()
}

func (s *LocalStorageService) storeOrNil() (*store, error) {
	if s.store == nil {
		return nil, errors.New("local storage not initialized")
	}
	return s.store, nil
}

func (s *LocalStorageService) GetServerList() ([]model.Server, error) {
	st, err := s.storeOrNil()
	if err != nil {
		return nil, err
	}
	list, err := st.listServers()
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = make([]model.Server, 0)
	}
	return list, nil
}

func (s *LocalStorageService) GetServerByID(id int64) (model.Server, error) {
	st, err := s.storeOrNil()
	if err != nil {
		return model.Server{}, err
	}
	sv, err := st.getServer(id)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Server{}, ErrNotFound
	}
	return sv, err
}

func (s *LocalStorageService) NewServer(Type int, Name, IP, User, PW, Comment string) (model.Server, error) {
	st, err := s.storeOrNil()
	if err != nil {
		return model.Server{}, err
	}
	now := time.Now().Unix()
	return st.createServer(model.Server{
		Type:      model.AuthMethod(Type),
		Name:      Name,
		IP:        IP,
		User:      User,
		PW:        PW,
		Comment:   Comment,
		CreatedAt: now,
		UpdatedAt: now,
	})
}

func (s *LocalStorageService) UpdateServer(id int64, Type int, Name, IP, User, PW, Comment string) error {
	st, err := s.storeOrNil()
	if err != nil {
		return err
	}
	err = st.updateServer(model.Server{
		ID:      id,
		Type:    model.AuthMethod(Type),
		Name:    Name,
		IP:      IP,
		User:    User,
		PW:      PW,
		Comment: Comment,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *LocalStorageService) DeleteServer(id int64) error {
	st, err := s.storeOrNil()
	if err != nil {
		return err
	}
	err = st.deleteServer(id)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}
