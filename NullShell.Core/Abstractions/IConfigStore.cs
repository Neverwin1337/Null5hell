using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 底层持久化契约（最重要：凭证持久化）。
/// 磁盘只存取「已加密字段」的模型，纯 IO，不涉及加解密逻辑。
/// </summary>
public interface IConfigStore
{
    Task<IReadOnlyList<HostConfig>> LoadHostsAsync(CancellationToken ct = default);
    Task SaveHostsAsync(IReadOnlyList<HostConfig> hosts, CancellationToken ct = default);

    Task<IReadOnlyList<StoredCredential>> LoadCredentialsAsync(CancellationToken ct = default);
    Task SaveCredentialsAsync(IReadOnlyList<StoredCredential> credentials, CancellationToken ct = default);
}
