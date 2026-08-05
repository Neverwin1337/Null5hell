---
name: code-review
description: Use when reviewing code in this nullshell project before merge/commit, when checking AI-generated code, AGENTS.md compliance, security, error handling, deployability, or SSH remote-command safety. Trigger keywords: review, code review, check, merge, pre-commit, AI-generated code, compliance, security review, remote command, ssh, portability.
---

# Reviewing Project Code

## Overview

Single review gate for the nullshell project (Wails v2 + Vue 3 + Go + SQLite, an SSH remote-management tool). Dispatches parallel subagents to review distinct angles, runs full verification, and produces one unified checklist with colored priority dots, detailed problems, fix proposals, and a final verdict.

**Core principle: one gate, five independent angles, one verdict.** Never review from a single angle; never claim mergeable without running all verification commands.

## When to Use

Use when the user asks to review this project's code, typically before merge or commit:

- "review this code / code review"
- "check AGENTS.md compliance"
- "security review"
- "can I merge / is this ready to commit"
- Reviewing AI-generated code before trusting it
- Reviewing code that runs commands on remote servers (SSH/SFTP)

Do NOT use for: single-file quick questions, writing new features, or debugging a specific bug.

## Workflow

### Step 1 — Discover and read the full structure (dynamic)

The project grows. Do NOT hardcode a fixed file list — discover what exists at review time:

- Use `glob` for `**/*.go`, `frontend/src/**/*`, and config files (`go.mod`, `wails.json`, `frontend/package.json`, `frontend/vite.config.js`, `**/*.json` in root)
- Read every relevant file that exists NOW, including `_test.go` files
- Read `AGENTS.md` (source of compliance rules)
- Note empty stub files (e.g. `package service` only) — record them as not-implemented placeholders, not necessarily failures

Read every file BEFORE reviewing it. Never review a file you have not read.

### Step 2 — Dispatch 5 parallel subagents

Use the `task` tool with `subagent_type: "general"`. One subagent per angle. Dispatch ALL in a single message so they run concurrently. Tell each subagent: research-only, do NOT write/edit code, do NOT run git commands, and return findings in the exact checklist format below.

| Subagent | Scope (mutually exclusive) |
|----------|---------------------------|
| Compliance | Every AGENTS.md rule: git ban, no file deletion, one-module-at-a-time, cross-platform no CGO, pinned versions, tool gate, gofmt/vet/tests |
| Security | AES-GCM usage, key management/persistence/permissions, plaintext password exposure, SQL injection, input validation, sensitive info in logs/errors |
| Correctness | Error capture completeness (silent swallows), edge cases, resource leaks, concurrency/data races, panic paths, CRUD logic |
| Multi-angle | Deployability (build order, wailsjs bindings, dist), extreme cases, error completeness, debuggability (logging), test coverage |
| SSH RemoteOps | Remote command execution safety and portability (rules below) |

**SSH RemoteOps review rules** — apply to any code that runs commands on remote servers. If no remote-command code exists yet, return one item: "no remote-command implementation yet — apply these rules when it lands".

- **Architecture portability:** commands must work across common architectures — amd64, i386, arm64/aarch64, armv7, riscv64, ppc64le. Flag any arch-specific binaries, paths, or assumptions.
- **Command availability + fallbacks:** never assume a single command exists. Examples: `netstat` → fallback `ss`; `ifconfig` → fallback `ip addr`; `free` → fallback `/proc/meminfo`; `ps` → fallback `/proc/*/stat`. Flag any info-gathering command used without a fallback chain.
- **Minimal systems:** BusyBox/Alpine/docker containers and old distros (CentOS 7, RHEL) lack GNU tools. Use POSIX-compatible commands; avoid bashisms (`[[ ]]`, arrays, `readarray`, `pushd`); use `sh -c`, not `bash -c`.
- **Destructive potential:** flag any command that can permanently damage the server — `rm -rf`, `dd`, `mkfs.*`, `fdisk`, `parted`, `reboot`, `shutdown`, `kill -9`, `truncate`, `>` redirection over existing files. Info-gathering must be read-only; destructive ops require explicit confirmation and ideally a dry-run mode.
- **Data integrity:** review what remote commands write and where (files, configs, services). Flag anything that overwrites or deletes server data without clear intent and confirmation.
- **Timeouts:** every remote command needs a timeout and cancellation so a hung server never hangs the app session.
- **Output robustness:** use `LC_ALL=C` for parseable output; handle empty output, non-zero exit codes, huge/unbounded output (limit or stream), and CRLF/LF differences.
- **Idempotency:** repeated runs must not corrupt state.
- **Resource impact:** avoid commands that peg CPU/disk (`top` unguarded, `find /`, `du -x /`). Prefer bounded/one-shot reads.
- **Injection/escaping:** when composing shell commands, escape user input to prevent local or remote command injection; prefer argument-array execution over string concatenation.

**Subagent return contract (REQUIRED):** each subagent must return a checklist where every item is exactly:

```
[PASS|P1|P2|P3] <category> - <check item> - <finding> (<file>:<line>, <severity>)
```

### Step 3 — Merge and dedupe

Collect all 5 results. Merge into one checklist. Deduplicate overlapping findings (baseline shows SetCtx swallow, DB-not-closed, missing validation get reported by 3+ agents — report once, cite all locations).

### Step 4 — Run full verification

Run ALL of these; record each result. Any failure here is P1:

1. `go vet ./...`
2. `go test ./...`
3. `gofmt -l .` (flag non-gofmt-clean files)
4. frontend `npm run build` (in `frontend/`)
5. `wails build`

Respect AGENTS.md: do NOT run git commands.

### Step 5 — Produce the report

Follow the Output Contract exactly.

## Output Contract (REQUIRED — exact shape)

Every checklist line carries a color dot. PASS = green. FAILs are ranked by fix priority:

| Dot | Priority | Meaning | Blocks merge? |
|-----|----------|---------|---------------|
| 🟢 | PASS | No issue found | No |
| 🔴 | P1 | Critical — security high, destructive/data-loss risk, verification failure | Yes |
| 🟠 | P2 | High — should fix before merge | Yes |
| 🟡 | P3 | Medium/low — fix when convenient | No |

```
## Review Checklist

🟢 PASS  - <category> - <check item> - <finding> (<file>:<line>)
🔴 P1    - <category> - <check item> - <finding> (<file>:<line>, <severity>)
🟠 P2    - <category> - <check item> - <finding> (<file>:<line>, <severity>)
🟡 P3    - <category> - <check item> - <finding> (<file>:<line>, <severity>)

(one line per item; PASS and FAIL both listed, color dot at line start)

## Detailed Issues (one section per FAIL item)

### <problem title> (<file>:<line>, P1|P2|P3, <severity>)
- Problem: <what happens, when triggered, impact>
- Fix proposal: <concrete fix, code-level suggestion or reference approach>

### <next problem> ...

## Verification Results

- go vet ./...: PASS|FAIL
- go test ./...: PASS|FAIL
- gofmt -l .: PASS|FAIL
- npm run build: PASS|FAIL
- wails build: PASS|FAIL

## Verdict

✅ Mergeable / ❌ Changes required (one-sentence reason)
```

**Verdict rules:**
- Any verification command FAIL → ❌ Changes required
- Any 🔴 P1 item → ❌ Changes required
- Any 🟠 P2 item → ❌ Changes required
- Only 🟢 PASS and 🟡 P3 items, verification green → ✅ Mergeable

**Every FAIL item MUST have its own Detailed Issues section** with both Problem and Fix proposal. A checklist without the problem/fix sections is incomplete.

## Common Mistakes

- **Reviewing only one angle** → always dispatch all 5 subagents in parallel.
- **Skipping verification** → the verdict is not valid unless all 5 commands ran. `npm run build` and `wails build` are part of the gate, not optional.
- **Hardcoding the file list** → discover the structure at review time with glob; the project grows.
- **Vague findings** → every item needs file:line and a priority dot; every FAIL needs a problem description + fix proposal.
- **Reviewing SSH code without portability rules** → always apply the SSH RemoteOps rules (arch, fallbacks, destructive ops, data integrity, timeouts).
- **Returning a verdict without the checklist** → all four sections are required.
- **Running git commands** → forbidden by AGENTS.md; never do it during review.
- **Overlapping duplicate reports** → merge and dedupe in Step 3 before writing the report.

## Red Flags — STOP and Restart

- You started reviewing before discovering and reading all files
- You dispatched fewer than 5 subagents (or one agent covered multiple angles)
- A subagent returned prose instead of `[PASS|P1|P2|P3]` lines
- A checklist line has no color dot
- You wrote a verdict without running all 5 verification commands
- A FAIL item has no Detailed Issues/Problem/Fix proposal section

**Any of these means the review is incomplete. Go back and redo the missing part.**
