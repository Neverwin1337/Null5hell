using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// SSH Key 管理（D - 生成/批量生成、加密存储、权限校验、防重复）。
/// </summary>
public interface ISshKeyManager
{
    /// <summary>生成单个密钥对。</summary>
    Task<SshKeyPair> GenerateAsync(string name, string algorithm, int bitSize, CancellationToken ct = default);

    /// <summary>批量生成多个密钥对。</summary>
    Task<IReadOnlyList<SshKeyPair>> GenerateManyAsync(IEnumerable<(string Name, string Algorithm, int BitSize)> specs, CancellationToken ct = default);

    /// <summary>列出全部本地密钥。</summary>
    Task<IReadOnlyList<SshKeyPair>> GetAllAsync(CancellationToken ct = default);

    /// <summary>删除本地密钥。</summary>
    Task DeleteAsync(Guid id, CancellationToken ct = default);

    /// <summary>校验私钥是否合法（能解密出可用私钥）。</summary>
    Task<bool> ValidateAsync(Guid id, CancellationToken ct = default);
}
