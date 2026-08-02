namespace NullShell.Core.Models;

/// <summary>
/// 可复用的 SSH 登录凭证（最重要：多凭证管理 + 持久化）。
/// 一次保存，多台主机可通过 HostConfig.CredentialId 复用（类似 Xshell 的「登录」）。
/// 磁盘上仅存密文，明文由 CredentialVault 在解锁态解密提供给连接层。
/// </summary>
public sealed class StoredCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>凭证名称（便于记忆与复用）。</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>认证方式。</summary>
    public AuthenticationMethod AuthMethod { get; set; } = AuthenticationMethod.Password;

    /// <summary>密码（AES-GCM 加密后存储）。</summary>
    public string EncryptedPassword { get; set; } = string.Empty;

    /// <summary>引用本地已保存的私钥（SshKeyPair.Id）。</summary>
    public Guid? PrivateKeyId { get; set; }

    /// <summary>服务器上的私钥路径（AuthMethod = ServerPrivateKey 时使用）。</summary>
    public string ServerPrivateKeyPath { get; set; } = string.Empty;

    /// <summary>创建时间。</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>最后使用时间。</summary>
    public DateTime? LastUsedAt { get; set; }
}
