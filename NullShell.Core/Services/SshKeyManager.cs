using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// Key 管理（D）。生成/批量生成密钥、校验权限、防重复。
/// TODO: 私钥生成用 SSHJ(org.apache?) 或本地 ssh-keygen/OpenSSH 库 -> PEM 私钥；
///       计算 OpenSSH 指纹做防重复；私钥经 ICryptoService 加密后存。
/// </summary>
public sealed class SshKeyManager : ISshKeyManager
{
    public Task<SshKeyPair> GenerateAsync(string name, string algorithm, int bitSize, CancellationToken ct = default)
        => throw new NotImplementedException("SshKeyManager.GenerateAsync");

    public Task<IReadOnlyList<SshKeyPair>> GenerateManyAsync(IEnumerable<(string Name, string Algorithm, int BitSize)> specs, CancellationToken ct = default)
        => throw new NotImplementedException("SshKeyManager.GenerateManyAsync");

    public Task<IReadOnlyList<SshKeyPair>> GetAllAsync(CancellationToken ct = default)
        => throw new NotImplementedException("SshKeyManager.GetAllAsync");

    public Task DeleteAsync(Guid id, CancellationToken ct = default)
        => throw new NotImplementedException("SshKeyManager.DeleteAsync");

    public Task<bool> ValidateAsync(Guid id, CancellationToken ct = default)
        => throw new NotImplementedException("SshKeyManager.ValidateAsync");
}
