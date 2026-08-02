namespace NullShell.Core.Abstractions;

/// <summary>
/// 终端会话管理器（B - 多标签页 = 多会话）。
/// </summary>
public interface ITerminalSessionManager
{
    /// <summary>创建（连接）一个新终端会话。</summary>
    Task<ITerminalSession> OpenAsync(Guid hostId, CancellationToken ct = default);

    /// <summary>关闭指定会话。</summary>
    Task CloseAsync(Guid sessionId);

    /// <summary>获取指定会话。</summary>
    ITerminalSession? Get(Guid sessionId);

    /// <summary>当前活跃会话。</summary>
    IEnumerable<ITerminalSession> ActiveSessions { get; }
}
