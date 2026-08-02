# AGENTS.md — NullShell 开发约定

给 AI 助手与协作者的仓库导航与硬性规则。改动前必读。

## 仓库布局

```
NullShell.slnx                解决方案入口（仅含 App + Core）
NullShell.Core/               业务/领域层 —— 所有 SSH/SFTP/安全/凭据逻辑都在这里，禁止依赖 UI
  Models/                     实体（DTO/POCO，序列化友好）
  Abstractions/               接口（模块边界，其他模块只依赖接口，不依赖具体实现）
  Services/                   实现（依赖 Abstractions 的接口 + SSH.NET）
NullShell.App/                Avalonia UI 层（MVVM；ViewModels + Views），只做展示，不写业务
```

## 分层铁律

1. **Core 不引用 App**，App 引用 Core（`ProjectReference` 已配好）。
2. 模块之间通信**只通过 `Abstractions/` 下的接口**；`Services/` 内部实现细节不外泄。
3. UI 层只调接口/模型，**不直接用 Renci.SshNet 类型**；SSH.NET 类型只在 Core 出现。
4. 领域逻辑放 Core；把代码塞进 ViewModel 是红线。

## 命名

- 接口：`I` 前缀 + 名（`ICredentialVault`、`ISshConnectionPool`）。
- 文件 = 一个类型 = 文件同名（`Abstract` 放 `Abstractions/`，实现放 `Services/`）。
- 命名空间：`NullShell.Core.Abstractions` / `NullShell.Core.Models` / `NullShell.Core.Services` / `NullShell.App.ViewModels` / `NullShell.App.Views`。
- 方法默认带 `CancellationToken ct = default`。
- 空实现/未完成方法必须抛 `NotImplementedException("类名.方法名")` 并留 `TODO`，禁止静默返回垃圾值。

## 已实现（改它们要谨慎）

以下为**真实可用**模块，改动前先跑冒烟测试（见下）：

- `Services/CryptoService.cs` — AES-256-GCM，格式 `iv(12)|tag(16)|ciphertext` Base64
- `Services/MasterPasswordService.cs` — PBKDF2-SHA256（210k 次迭代），落盘 `master.dat`
- `Services/EncryptedJsonStore.cs` — 原子写 + 信号量；数据只存 `%AppData%/NullShell/config.json`
- `Services/CredentialVault.cs` — 编排加密/持久化；锁定态拒绝解密
- `Services/SessionContext.cs` — 主密钥生命周期，`Lock()` 必须清零密钥

## 待实现（骨架，填充实现即可）

所有 `Services/` 下其余文件 + `Abstractions/` 接口均为此类。实现时必须**保持接口签名不变**（分工依据），只填方法体。

## 安全红线（不可违反）

- **磁盘上永远不允许出现明文密码/私钥**。所有敏感字符串必须经 `ICryptoService` 加密后才可落盘。
- 主密钥只存在于 `ISessionContext`；程序退出或锁定时必须清零（`CryptographicOperations.ZeroMemory`）。
- 解密操作一律要求 `session.IsUnlocked`，否则抛 `InvalidOperationException`。
- 不要为加密字段起误导性名字（`Password` 表示明文、`EncryptedPassword` 表示密文，别混）。
- 禁止把密钥/密码写进日志。

## 构建 / 测试

```bash
dotnet build NullShell.slnx          # 目标 0 警告 0 错误
```

冒烟测试（改安全模块后必须跑）：用临时控制台项目引用 Core，验证
主密码设置→派生密钥→解锁→存凭证/主机→新建实例重读→解密一致→篡改密文被 GCM 拒绝→锁定后拒绝解密。
测完删除临时项目。

## 编辑器/工具

- 不要提交 `obj/`、`bin/`、`.vs/`、`*.user`（见 `.gitignore`）。
- 不要提交本机路径或密钥文件。
- 中文注释优先（团队使用 zh-CN）。
