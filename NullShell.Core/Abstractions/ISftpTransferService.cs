using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 传输服务（C - 上传/下载：进度、断点续传、多线程分片）。
/// </summary>
public interface ISftpTransferService : IDisposable
{
    /// <summary>上传单个文件。</summary>
    Task UploadAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken ct = default);

    /// <summary>下载单个文件。</summary>
    Task DownloadAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken ct = default);

    /// <summary>取消指定传输。</summary>
    void Cancel(Guid transferId);
}
