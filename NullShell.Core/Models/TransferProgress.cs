namespace NullShell.Core.Models;

/// <summary>
/// 传输进度（C - SFTP 上传/下载，支持进度、断点、多线程分片）。
/// </summary>
public sealed class TransferProgress
{
    public Guid TransferId { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public long TotalBytes { get; set; }
    public long TransferredBytes { get; set; }
    public double Percent => TotalBytes <= 0 ? 0 : TransferredBytes * 100.0 / TotalBytes;
    public long BytesPerSecond { get; set; }
    public TransferDirection Direction { get; set; }
    public bool IsComplete { get; set; }
    public string? Error { get; set; }
}

public enum TransferDirection
{
    Upload = 0,
    Download = 1,
}
