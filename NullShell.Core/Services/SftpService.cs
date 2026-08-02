using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// SFTP 文件操作（C）。基于 Renci.SshNet.SftpClient。
/// TODO: ListDirectory -> SftpFile 映射 RemoteFileInfo；Rename/Delete/SetPermissions 直接调用。
/// </summary>
public sealed class SftpService : ISftpService
{
    public Task<IReadOnlyList<RemoteFileInfo>> ListDirectoryAsync(string path, CancellationToken ct = default)
        => throw new NotImplementedException("SftpService.ListDirectoryAsync");

    public Task CreateDirectoryAsync(string path, CancellationToken ct = default)
        => throw new NotImplementedException("SftpService.CreateDirectoryAsync");

    public Task RenameAsync(string oldPath, string newPath, CancellationToken ct = default)
        => throw new NotImplementedException("SftpService.RenameAsync");

    public Task DeleteAsync(string path, bool recursive, CancellationToken ct = default)
        => throw new NotImplementedException("SftpService.DeleteAsync");

    public Task SetPermissionsAsync(string path, string mode, CancellationToken ct = default)
        => throw new NotImplementedException("SftpService.SetPermissionsAsync");

    public async ValueTask DisposeAsync()
    {
        await Task.CompletedTask;
    }
}
