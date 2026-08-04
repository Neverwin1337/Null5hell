# AGENTS.md — Project Guidelines

## Project Overview

Wails v3 desktop application (targets **macOS, Windows, and Linux desktop only** — no iOS/Android/mobile):
- **Frontend**: Vue 3 + Vite (`frontend/`)
- **Backend**: Go (Wails bindings in `main.go`; business logic in `service/` and `model/`)
- **Database**: SQLite via `modernc.org/sqlite` (pure Go, no CGO)
- Frontend/backend communicate through generated Wails v3 bindings (`frontend/bindings/`)
- Build orchestrated by Taskfile tasks, invoked via the `wails3` CLI (`wails3 build`/`wails3 task`)

Existing services: SSH (`service/SshConnection.go`), Sessions (`service/Session.go`), FileManager, PsList, NetMonitor, ResMonitor, LocalDatabase, LocalStorageService.

## Working Principles (IMPORTANT)

1. **Do not fully rely on AI-generated code.** Generated code must be reviewed and confirmed by the human. Do not blindly modify.
2. **Do NOT run Git commands.** No `git add` / `commit` / `push` / `pull` / `reset` / `rebase` / `merge` / `log` / `diff` / `status`. Do exactly what you are asked; do not self-initiate git inspection (log, diff, etc.).
3. **Never delete files without asking.**
4. **Always ask before high-risk operations:** deleting/overwriting files, batch changes, database schema changes, destructive refactors, or changes affecting existing functionality.
5. **If unsure whether a task is in scope, stop and ask.** Do not expand scope on your own.
6. **Prefer modifying existing files over creating new ones.**
7. **If you encounter deprecated functions/APIs, stop and ask first** before deciding to keep or remove them.
8. **Keep it minimal.** Use the simplest approach unless the user explicitly requests more. No over-engineering, no unrequested files or libraries.
9. **Work on one module at a time.** Implement or modify the functionality of only ONE module per task; do not modify multiple modules simultaneously.

## Dependencies & Compatibility

- **Do not change committed library versions** without explicit permission.
- Any new dependency (Go / npm / frontend) must be **cross-platform**: it must work on **macOS, Linux, and Windows**. Prefer pure Go (no CGO). Confirm with the user before adding anything.

## Library Lookups

- For **any** library, framework, SDK, API, CLI tool, or cloud-service question, use the **context7** tool (Context7 MCP) and the **grep_app** tool. Always look these up via Context7 rather than relying on memory.
- **Tool availability gate:** If the **context7** tool or the **grep_app** tool is NOT available (unavailable, removed, or not connected), NO operations or modifications are allowed. Stop the conversation immediately and do not proceed with any task, read, edit, or build.

## Code Style

- **Go**: run standard formatting/linting (`gofmt`, `go vet`); include `_test.go` unit tests.
- **Vue**: follow existing component/directory conventions; keep it simple.

## Before Reporting Done

Run verification: `go test ./...`, frontend `npm run build`, and `wails3 build`. Confirm the results before claiming success.
