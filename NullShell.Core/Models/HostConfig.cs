namespace NullShell.Core.Models;

/// <summary>
/// SSH 主机连接配置（A - 连接核心）。
/// </summary>
public sealed class HostConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>显示名称。</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>主机地址 / IP。</summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>端口。</summary>
    public int Port { get; set; } = 22;

    /// <summary>用户名。</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>认证方式。</summary>
    public AuthenticationMethod AuthMethod { get; set; } = AuthenticationMethod.Password;

    /// <summary>密码（加密后存储，不为明文）。当引用了 CredentialId 时通常为空。</summary>
    public string EncryptedPassword { get; set; } = string.Empty;

    /// <summary>引用一个可复用的 StoredCredential（多台账号复用）。</summary>
    public Guid? CredentialId { get; set; }

    /// <summary>引用本地已保存的私钥（详见 SshKeyPair.Id）。</summary>
    public Guid? PrivateKeyId { get; set; }

    /// <summary>服务器上的私钥路径（AuthMethod = ServerPrivateKey 时使用）。</summary>
    public string ServerPrivateKeyPath { get; set; } = string.Empty;

    /// <summary>所属分组。</summary>
    public Guid? GroupId { get; set; }

    /// <summary>心跳保活间隔（秒，0 表示不启用）。</summary>
    public int KeepAliveIntervalSeconds { get; set; } = 30;

    /// <summary>备注。</summary>
    public string Remark { get; set; } = string.Empty;
}
