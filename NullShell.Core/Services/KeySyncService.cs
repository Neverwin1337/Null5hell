using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// 公钥同步（D）。ssh-copy-id 等价：连接到目标机，校验 authorized_keys 是否已含该公钥指纹，
/// 未含则追加。支持一键同步到多台。
/// TODO: 校验防重复(读 authorized_keys 找指纹) -> 追加公钥行；多台并行推送并上报进度。
/// </summary>
public sealed class KeySyncService : IKeySyncService
{
    public Task<bool> PushToHostAsync(HostConfig target, SshKeyPair key, CancellationToken ct = default)
        => throw new NotImplementedException("KeySyncService.PushToHostAsync");

    public Task<IReadOnlyDictionary<Guid, bool>> PushToManyAsync(IEnumerable<HostConfig> targets, SshKeyPair key, IProgress<(Guid HostId, bool Success, string? Error)>? progress = null, CancellationToken ct = default)
        => throw new NotImplementedException("KeySyncService.PushToManyAsync");
}
