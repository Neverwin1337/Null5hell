# LocalStorage 服务器列表持久化设计

日期：2026-08-02
状态：已批准

## 目标

完善 `service/LocalStorage.go`，让服务器列表支持增删改查（CRUD），
持久化到 SQLite，跨平台（macOS / Windows / Linux），服务器密码加密存储。

## 背景与现状

- 项目为 Wails v2（Go 后端 + Vue 前端）应用。
- `service/LocalStorage.go` 目前是语法损坏的 stub（import 用逗号、`errors` 被当作类型）。
- `model.Server.go` 仅有 `Type/Name/IP/User/PW/Comment` 字段，无主键 ID。

## 决策

1. **SQLite 驱动**：`modernc.org/sqlite`——纯 Go 实现，无 CGO，三平台交叉编译无忧。
2. **数据库位置**：`os.UserConfigDir()/nullshell/nullshell.db`
   - Windows: `%AppData%\nullshell\`
   - macOS: `~/Library/Application Support/nullshell/`
   - Linux: `~/.config/nullshell/`
   - 首次运行自动创建目录与表。
3. **密码存储**：AES-256-GCM 加密后入库，读取时解密。
   - 首次运行生成随机 32 字节密钥，写入同目录 `secret.key`，Unix 下 chmod 0600。
4. **密钥管理**：本地密钥文件方案（非系统钥匙串），跨平台一致、无需平台专有依赖。

## 数据模型 `model/Server.go`

新增字段：

```go
type Server struct {
    ID        int64
    Type      AuthMethod
    Name      string
    IP        string
    User      string
    PW        string   // 对外始终是明文；入库前加密，读取后解密
    Comment   string
    CreatedAt int64    // Unix 秒
    UpdatedAt int64    // Unix 秒
}
```

`AuthMethod` 保持 `Password(0) / SSHKEY(1)`。

## 数据库表

```sql
CREATE TABLE IF NOT EXISTS servers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  ip         TEXT    NOT NULL,
  user       TEXT    NOT NULL,
  pw         BLOB    NOT NULL,
  comment    TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 组件与边界

为保持单一职责，拆分为两个 Go 文件：

### 1. `service/store.go` — 持久化 + 密钥（内部实现）
- `type store struct { db *sql.DB; key []byte }`
- `openStore() (*store, error)`：解析数据目录、确保存在、生成/加载密钥、打开 DB、建表。
- `close()`：关闭 DB。
- 加密/解密辅助：`encrypt(pw string) ([]byte, error)`、`decrypt(b []byte) (string, error)`。
- CRUD 原始 SQL 操作（供上层组装 Server 对象）。

### 2. `service/LocalStorage.go` — Wails 绑定 API（对外）
- `NewLocalStorageService() *LocalStorageService`
- `SetCtx(ctx)`：可用 Wails `app.GetRuntime` 之类能力，本设计暂不依赖。
- `GetServerList() ([]model.Server, error)`：读取全部，逐条解密 PW。
- `NewServer(Type int, Name, IP, User, PW, Comment string) (model.Server, error)`：插入，返回含 ID 及时间戳。
- `GetServerByID(id int64) (model.Server, error)`。
- `UpdateServer(id int64, Type int, Name, IP, User, PW, Comment string) error`：更新并刷新 `updated_at`。
- `DeleteServer(id int64) error`：不存在时返回明确错误。

设计要点：
- `LocalStorageService` 持有 `store`。`SetCtx` 时打开 store 一次并复用连接；`NewLocalStorageService` 不初始化 store，与 Wails 生命周期一致。
- 未初始化（未调用 SetCtx）时调用 API 返回明确的「未初始化」错误。

## 出错处理

- 目录创建失败、密钥生成/读取失败、AES-GCM 加解密失败、打开数据库失败、SQL 执行失败：均返回 error 向上传递。
- 删除/更新不存在的 ID：返回明确错误。
- 空列表：返回空切片（非 nil），方便前端。

## 测试

- `service` 包单测：
  - 密钥生成 + 加解密往返（明文==解密后）
  - CRUD：新建→列表→按 ID 查→修改→删除
- 使用 `t.TempDir()`，将数据目录指向临时目录（store 的数据目录需可注入，便于测试）。
- 验证命令：`go test ./...`

## 范围

- 仅后端（Go）。前端 Vue 调用不在本次实现范围（可由后续任务接入）。
- 不引入系统钥匙串。
- 不迁移旧数据（当前无存量数据）。

## 验收

- `go build` 通过。
- `go test ./...` 通过。
- `GetServerList/NewServer/GetServerByID/UpdateServer/DeleteServer` 行为符合上述定义。
