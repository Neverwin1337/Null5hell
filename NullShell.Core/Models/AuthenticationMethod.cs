namespace NullShell.Core.Models;

/// <summary>
/// SSH 认证方式（A - 连接核心 / D - Key 管理）。
/// </summary>
public enum AuthenticationMethod
{
    /// <summary>密码认证。</summary>
    Password = 0,

    /// <summary>本地私钥认证。</summary>
    PrivateKey = 1,

    /// <summary>使用服务器上已存在的私钥认证。</summary>
    ServerPrivateKey = 2,

    /// <summary>ssh-agent 认证（后续扩展）。</summary>
    Agent = 3,
}
