using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 系统监控（E - 硬件信息、实时指标、进程、网络）。
/// </summary>
public interface ISystemMonitor : IDisposable
{
    /// <summary>获取静态硬件信息。</summary>
    Task<SystemInfo> GetSystemInfoAsync(CancellationToken ct = default);

    /// <summary>获取一次实时指标快照。</summary>
    Task<SystemMetrics> GetMetricsAsync(CancellationToken ct = default);

    /// <summary>获取进程列表（可按用户/内存排序）。</summary>
    Task<IReadOnlyList<ProcessInfo>> GetProcessesAsync(ProcessSort sort, CancellationToken ct = default);

    /// <summary>获取网络状况。</summary>
    Task<NetworkInfo> GetNetworkAsync(CancellationToken ct = default);

    /// <summary>订阅持续轮询的实时指标流。</summary>
    IAsyncEnumerable<SystemMetrics> MetricsStreamAsync(TimeSpan interval, CancellationToken ct = default);
}

public enum ProcessSort
{
    ByUser = 0,
    ByMemory = 1,
    ByCpu = 2,
}
