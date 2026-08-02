# NullShell

跨平台 SSH 桌面客户端（类 Xshell / MobaXterm）。基于 **Avalonia UI + .NET 10**，使用 **SSH.NET** 实现 SSH/SFTP。

> 当前阶段：**骨架 + 核心能力落地中**。凭证管理/持久化、主密码、AES-GCM 加密已真实可用；其余模块为接口 + 空实现骨架，按分工填充。

---

## 一、技术栈

| 层 | 技术 |
|---|---|
| 运行时 | .NET 10（net10.0） |
| UI | Avalonia 12.1.1（Fluent 主题）+ CommunityToolkit.Mvvm |
| SSH / SFTP | SSH.NET 2025.1.0（Renci.SshNet） |
| 图表 | LiveChartsCore.SkiaSharpView.Avalonia |
| 图标 | Projektanker.Icons.Avalonia.FontAwesome |

## 二、项目结构

```
NullShell.slnx                      解决方案（App + Core）
├─ NullShell.Core       业务/领域层（不依赖 UI）
│  ├─ Models/           实体：HostConfig、StoredCredential、SshKeyPair、
│  │                    RemoteFileInfo、SystemInfo/Metrics、ProcessInfo、NetworkInfo…
│  ├─ Abstractions/     接口：ICredentialVault、IConfigStore、ISshConnectionPool、
│  │                    ITerminalSession、ISftpService、ISshKeyManager、
│  │                    ISystemMonitor、IPasswordProtection…（见文档第四节）
│  └─ Services/         实现：CredentialVault、EncryptedJsonStore、CryptoService、
│                       MasterPasswordService、SshConnectionPool、TerminalSession…
└─ NullShell.App        Avalonia UI 层（MVVM：ViewModels / Views）
```

## 三、功能规划（对应需求 A~F）

- **A 连接核心** — 主机配置 CRUD、连接池+复用、心跳保活、密码/私钥/服务器私钥认证
- **B 终端** — PTY、resize、双向流式、多标签多会话
- **C SFTP 文件管理** — 目录浏览、上传/下载（进度/断点/多线程分片）、文件操作
- **D SSH Key 管理+同步** — 生成/批量生成、加密存储、公钥推送（ssh-copy-id 等价）、一键多机同步
- **E 系统监控** — 硬件信息、实时指标、进程列表、网络状况
- **F 安全/存储** — 主密码 + AES-GCM 加密、会话隔离、鉴权

## 四、核心数据流 & 接口速查

### 4.1 安全与凭证（**已实现**，最重要）

```
解锁流程
  User 输入主密码
   └─ MasterPasswordService.Verify() 校验  (PBKDF2-SHA256, 21万次迭代)
   └─ MasterPasswordService.DeriveKey() → 32B AES-256 主密钥
   └─ SessionContext.Unlock(key)            ← 会话持有主密钥

持久化流程（ICredentialVault）
  SaveHostAsync / SaveCredentialAsync
   └─ CryptoService.Encrypt(主密钥, 明文)   AES-256-GCM → 密文
   └─ EncryptedJsonStore.Save*()            写入 %AppData%/NullShell/config.json（仅密文，原子写）
```

关键接口：

| 接口 | 职责 |
|---|---|
| `ICredentialVault` | 凭证库入口：主机/可复用凭证 CRUD + 加解密（解锁后可读明文） |
| `IConfigStore` | 底层 JSON 持久化（纯 IO，不涉加解密） |
| `ICryptoService` | AES-256-GCM 加解密 |
| `IPasswordProtection` | 主密码设置/校验/派生 |
| `ISessionContext` | 会话解锁态 + 主密钥生命周期（Lock 即清零） |

### 4.2 连接（待实现）

```
ISshConnectionFactory → SshClient / SftpClient（按认证方式）
        ↓ 复用
ISshConnectionPool → 按 hostId 缓存 + 心跳保活
        ↓
ITerminalSession / ISystemMonitor / ISftpService ...
```

### 4.3 存储文件

| 文件 | 位置 | 内容 |
|---|---|---|
| `config.json` | `%AppData%/NullShell/` | 主机、凭证（字段均为密文） |
| `master.dat` | `%AppData%/NullShell/` | 主密码盐 + 验证哈希 |

> 磁盘上**不存在任何明文密码/私钥**。

## 五、构建与运行

```bash
# 构建整个解决方案
dotnet build NullShell.slnx

# 运行桌面应用
dotnet run --project NullShell.App
```

## 六、分工与里程碑

详见 **`NullShell_分工_规划.xlsx`**（Sheet 1 概览 / Sheet 2 分工矩阵 / Sheet 3 里程碑）。

建议顺序：
- **M1（P0）**安全与连接：主密码+加密+会话（✅）、凭证持久化（✅）、配置 CRUD、连接工厂、连接池
- **M2（P0）**终端可用：PTY 会话 + 多标签 + UI
- **M3（P1）**文件与 Key：SFTP 浏览/传输 + 密钥生成/推送
- **M4（P2）**监控与打磨：监控指标 + 一键多机同步 + 界面完善
- **M5**扩展：管理 API 鉴权等

## 七、当前进度

| 能力 | 状态 |
|---|---|
| 主密码（PBKDF2） | ✅ 已实现（冒烟测试通过） |
| AES-256-GCM 加解密 | ✅ 已实现（篡改即报错） |
| 多凭证 + 持久化（CredentialVault / EncryptedJsonStore） | ✅ 已实现（落盘仅密文，跨实例重读通过） |
| 会话隔离 / 锁定 | ✅ 已实现 |
| 其余 A~E 模块 | 🚧 接口 + 空骨架，待分工实现 |
