namespace NullShell.Core.Models;

/// <summary>
/// SSH 密钥对（D - Key 管理 + 同步）。
/// </summary>
public sealed class SshKeyPair
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>密钥名称 / 备注。</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>密钥算法（ed25519 / rsa / ecdsa）。</summary>
    public string Algorithm { get; set; } = "ed25519";

    /// <summary>私钥位数 / 曲线参数。</summary>
    public int BitSize { get; set; } = 256;

    /// <summary>公开指纹（用于识别与防重复）。</summary>
    public string PublicFingerprint { get; set; } = string.Empty;

    /// <summary>公钥内容（Base64 / OpenSSH 格式）。</summary>
    public string PublicKey { get; set; } = string.Empty;

    /// <summary>私钥（加密存储，来源见 CredentialVault）。</summary>
    public string EncryptedPrivateKey { get; set; } = string.Empty;

    /// <summary>创建时间。</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
