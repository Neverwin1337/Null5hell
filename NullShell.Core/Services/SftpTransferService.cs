using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// 传输服务（C）。多线程分片 + 断点续传 + 进度上报。
/// TODO: 上传/下载按 FixedBlockSize 分片并行；本地记录 .part 文件做断点；
///       汇总分片进度到 TransferProgress 并回调 IProgress。
/// </summary>
public sealed class SftpTransferService : ISftpTransferService
{
    public Task UploadAsync(string localPath, string remotePath, IProgress<TransferProgress>? progress = null, CancellationToken ct = default)
        => throw new NotImplementedException("SftpTransferService.UploadAsync");

    public Task DownloadAsync(string remotePath, string localPath, IProgress<TransferProgress>? progress = null, CancellationToken ct = default)
        => throw new NotImplementedException("SftpTransferService.DownloadAsync");

    public void Cancel(Guid transferId)
    {
        throw new NotImplementedException("SftpTransferService.Cancel");
    }

    public void Dispose()
    {
    }
}
