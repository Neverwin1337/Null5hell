using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 公钥推送/同步（D - ssh-copy-id 等价实现 + 一键同步到多台服务器）。
/// </summary>
public interface IKeySyncService
{
    /// <summary>把公钥追加到目标机 authorized_keys（幂等、防重复）。</summary>
    Task<bool> PushToHostAsync(HostConfig target, SshKeyPair key, CancellationToken ct = default);

    /// <summary>一键把公钥批量推送到多台服务器。</summary>
    Task<IReadOnlyDictionary<Guid, bool>> PushToManyAsync(IEnumerable<HostConfig> targets, SshKeyPair key, IProgress<(Guid HostId, bool Success, string? Error)>? progress = null, CancellationToken ct = default);
}
