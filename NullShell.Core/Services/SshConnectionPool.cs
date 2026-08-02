using NullShell.Core.Abstractions;
using Renci.SshNet;

namespace NullShell.Core.Services;

/// <summary>
/// 连接池（A）。按 hostId 复用 SshClient，超时回收 + 心跳保活（KeepAliveInterval）。
/// TODO: ConcurrentDictionary<Guid, Stack<SshClient>>；空闲超时回收；SendKeepAlive 定时器。
/// </summary>
public sealed class SshConnectionPool : ISshConnectionPool
{
    public Task<SshClient> AcquireAsync(Guid hostId, CancellationToken ct = default)
        => throw new NotImplementedException("SshConnectionPool.AcquireAsync");

    public Task ReleaseAsync(Guid hostId, SshClient client)
        => throw new NotImplementedException("SshConnectionPool.ReleaseAsync");

    public Task InvalidateAsync(Guid hostId)
        => throw new NotImplementedException("SshConnectionPool.InvalidateAsync");

    public Task StartAsync(CancellationToken ct = default)
        => throw new NotImplementedException("SshConnectionPool.StartAsync");

    public void Dispose()
    {
    }
}
