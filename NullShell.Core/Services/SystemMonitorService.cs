using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// 系统监控（E）。通过 SSH 执行命令解析：uname / lscpu / free / df / top / ps / ss 等。
/// TODO: GetSystemInfo -> uname -a + lscpu + df; GetMetrics -> 两次采样算 CPU%；
///       GetProcesses -> ps -eo 解析; GetNetwork -> cat /proc/net/dev + ss -lntp。
/// </summary>
public sealed class SystemMonitorService : ISystemMonitor
{
    public Task<SystemInfo> GetSystemInfoAsync(CancellationToken ct = default)
        => throw new NotImplementedException("SystemMonitorService.GetSystemInfoAsync");

    public Task<SystemMetrics> GetMetricsAsync(CancellationToken ct = default)
        => throw new NotImplementedException("SystemMonitorService.GetMetricsAsync");

    public Task<IReadOnlyList<ProcessInfo>> GetProcessesAsync(ProcessSort sort, CancellationToken ct = default)
        => throw new NotImplementedException("SystemMonitorService.GetProcessesAsync");

    public Task<NetworkInfo> GetNetworkAsync(CancellationToken ct = default)
        => throw new NotImplementedException("SystemMonitorService.GetNetworkAsync");

    public async IAsyncEnumerable<SystemMetrics> MetricsStreamAsync(TimeSpan interval, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
    {
        while (!ct.IsCancellationRequested)
        {
            yield return await GetMetricsAsync(ct);
            await Task.Delay(interval, ct);
        }
    }

    public void Dispose()
    {
    }
}
