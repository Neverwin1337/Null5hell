namespace NullShell.Core.Models;

/// <summary>
/// 实时指标（E - 系统监控，轮询 / 推送）。
/// </summary>
public sealed class SystemMetrics
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>CPU 使用率（0-100）。</summary>
    public double CpuUsagePercent { get; set; }

    /// <summary>总内存。</summary>
    public long TotalMemoryBytes { get; set; }

    /// <summary>已用内存。</summary>
    public long UsedMemoryBytes { get; set; }

    /// <summary>负载（1 / 5 / 15 分钟）。</summary>
    public double LoadAvg1 { get; set; }
    public double LoadAvg5 { get; set; }
    public double LoadAvg15 { get; set; }

    /// <summary>各盘使用率。</summary>
    public IReadOnlyList<DiskUsage>? Disks { get; set; }
}

public sealed class DiskUsage
{
    public string MountPoint { get; set; } = string.Empty;
    public string FileSystem { get; set; } = string.Empty;
    public long TotalBytes { get; set; }
    public long UsedBytes { get; set; }
    public double UsagePercent { get; set; }
}
