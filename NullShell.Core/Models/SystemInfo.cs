namespace NullShell.Core.Models;

/// <summary>
/// 服务器静态硬件信息（E - 系统监控）。
/// </summary>
public sealed class SystemInfo
{
    public string OsName { get; set; } = string.Empty;
    public string OsVersion { get; set; } = string.Empty;
    public string Architecture { get; set; } = string.Empty;
    public string CpuModel { get; set; } = string.Empty;
    public int CpuCoreCount { get; set; }
    public long TotalMemoryBytes { get; set; }
    public long TotalDiskBytes { get; set; }
    public string HostName { get; set; } = string.Empty;
    public string KernelVersion { get; set; } = string.Empty;
}
