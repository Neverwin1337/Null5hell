using Renci.SshNet;

namespace NullShell.Core.Abstractions;

/// <summary>
/// SSH 连接池 + 复用（A - 连接核心：复用、心跳保活、超时回收）。
/// </summary>
public interface ISshConnectionPool : IDisposable
{
    /// <summary>获取或新建一个可用连接（按 host 复用）。</summary>
    Task<SshClient> AcquireAsync(Guid hostId, CancellationToken ct = default);

    /// <summary>归还连接到池中。</summary>
    Task ReleaseAsync(Guid hostId, SshClient client);

    /// <summary>强制断开某主机的所有连接。</summary>
    Task InvalidateAsync(Guid hostId);

    /// <summary>启动心跳保活定时任务。</summary>
    Task StartAsync(CancellationToken ct = default);
}
