using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// SFTP 文件操作（C - 目录浏览、文件操作）。
/// </summary>
public interface ISftpService : IAsyncDisposable
{
    /// <summary>列出目录内容。</summary>
    Task<IReadOnlyList<RemoteFileInfo>> ListDirectoryAsync(string path, CancellationToken ct = default);

    /// <summary>创建目录。</summary>
    Task CreateDirectoryAsync(string path, CancellationToken ct = default);

    /// <summary>重命名 / 移动。</summary>
    Task RenameAsync(string oldPath, string newPath, CancellationToken ct = default);

    /// <summary>删除文件或目录。</summary>
    Task DeleteAsync(string path, bool recursive, CancellationToken ct = default);

    /// <summary>修改权限（chmod）。</summary>
    Task SetPermissionsAsync(string path, string mode, CancellationToken ct = default);
}
