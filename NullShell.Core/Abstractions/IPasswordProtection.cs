namespace NullShell.Core.Abstractions;

/// <summary>
/// 主密码保护（F - 主密码设置/解锁/校验、主密钥派生）。
/// </summary>
public interface IPasswordProtection
{
    bool IsMasterPasswordSet { get; }

    /// <summary>首次设置主密码（生成盐并派生主密钥）。</summary>
    Task SetMasterPasswordAsync(string password, CancellationToken ct = default);

    /// <summary>校验主密码是否正确。</summary>
    Task<bool> VerifyAsync(string password, CancellationToken ct = default);

    /// <summary>派生主密钥（AES-GCM 用）。返回解密用密钥句柄。</summary>
    Task<byte[]> DeriveKeyAsync(string password, CancellationToken ct = default);

    /// <summary>锁定（丢弃内存中的主密钥）。</summary>
    Task LockAsync(CancellationToken ct = default);
}
