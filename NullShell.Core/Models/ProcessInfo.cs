namespace NullShell.Core.Models;

/// <summary>
/// 进程信息（E - 系统监控，ps 解析，按用户/内存排序）。
/// </summary>
public sealed class ProcessInfo
{
    public int Pid { get; set; }
    public string User { get; set; } = string.Empty;
    public double CpuPercent { get; set; }
    public long MemoryBytes { get; set; }
    public string Command { get; set; } = string.Empty;
}
