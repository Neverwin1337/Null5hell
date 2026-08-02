using NullShell.Core.Models;
using Renci.SshNet;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 根据 HostConfig 构建 SSH 连接（A - 连接核心，支持密码/私钥/服务器私钥）。
/// </summary>
public interface ISshConnectionFactory
{
    /// <summary>创建已连接、可用的 SshClient。</summary>
    Task<SshClient> CreateConnectedAsync(HostConfig host, CancellationToken ct = default);

    /// <summary>创建已连接的 SftpClient（复用同一底层连接或新开）。</summary>
    Task<SftpClient> CreateSftpAsync(HostConfig host, CancellationToken ct = default);
}
