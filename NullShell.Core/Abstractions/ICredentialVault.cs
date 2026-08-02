using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 凭证库（UI/连接层入口）——最重要的能力：
/// 管理整机与可复用凭证，落盘前自动用主密钥加密，读取后按需解密。
/// 所有加解密操作要求 App 处于解锁态，否则抛 InvalidOperationException。
/// </summary>
public interface ICredentialVault
{
    // ---- 主机 ----
    Task<IReadOnlyList<HostConfig>> GetHostsAsync(CancellationToken ct = default);
    Task<HostConfig?> GetHostAsync(Guid id, CancellationToken ct = default);

    /// <summary>保存/更新主机。plainPassword 非空时先用主密钥加密再写入 EncryptedPassword。</summary>
    Task SaveHostAsync(HostConfig host, string? plainPassword = null, CancellationToken ct = default);

    Task DeleteHostAsync(Guid id, CancellationToken ct = default);

    // ---- 可复用凭证 ----
    Task<IReadOnlyList<StoredCredential>> GetCredentialsAsync(CancellationToken ct = default);
    Task<StoredCredential?> GetCredentialAsync(Guid id, CancellationToken ct = default);

    /// <summary>保存/更新凭证。plainPassword 非空时先加密再写入。</summary>
    Task SaveCredentialAsync(StoredCredential credential, string? plainPassword = null, CancellationToken ct = default);

    Task DeleteCredentialAsync(Guid id, CancellationToken ct = default);

    // ---- 加解密（连接层取明文密码用） ----
    Task<string> EncryptAsync(string plaintext, CancellationToken ct = default);
    Task<string> DecryptAsync(string encrypted, CancellationToken ct = default);

    /// <summary>校验某条数据在解锁态下能否正常解密（凭据完整性校验）。</summary>
    Task<bool> ValidateDecryptableAsync(string encrypted, CancellationToken ct = default);
}
