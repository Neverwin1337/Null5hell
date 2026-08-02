namespace NullShell.Core.Models;

/// <summary>
/// 远程文件 / 目录信息（C - SFTP 文件管理）。
/// </summary>
public sealed class RemoteFileInfo
{
    public string Name { get; set; } = string.Empty;
    public string FullPath { get; set; } = string.Empty;
    public bool IsDirectory { get; set; }
    public long Length { get; set; }
    public DateTime LastWriteTime { get; set; }
    public string Permissions { get; set; } = string.Empty; // 如 -rwxr-xr-x
    public int OwnerUserId { get; set; }
    public int OwnerGroupId { get; set; }
}
