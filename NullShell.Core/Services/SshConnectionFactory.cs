using NullShell.Core.Abstractions;
using Renci.SshNet;

namespace NullShell.Core.Services;

/// <summary>
/// 连接工厂（A）。根据认证方式构建并连接 SshClient/SftpClient。
/// TODO: 密码 -> new PasswordConnectionInfo；私钥 -> PrivateKeyAuthenticationMethod；
///       服务器私钥 -> 先 get 到路径再加载对应的服务器私钥内容（经 SFTP 读取）。
/// </summary>
public sealed class SshConnectionFactory : ISshConnectionFactory
{
    public Task<SshClient> CreateConnectedAsync(Models.HostConfig host, CancellationToken ct = default)
    {
        throw new NotImplementedException("SshConnectionFactory.CreateConnectedAsync");
    }

    public Task<SftpClient> CreateSftpAsync(Models.HostConfig host, CancellationToken ct = default)
    {
        throw new NotImplementedException("SshConnectionFactory.CreateSftpAsync");
    }
}
