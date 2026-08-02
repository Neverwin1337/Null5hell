using System.Collections.Concurrent;
using NullShell.Core.Abstractions;

namespace NullShell.Core.Services;

/// <summary>
/// 终端会话管理器（B）。多标签页 = 多个 ITerminalSession，字典管理。
/// </summary>
public sealed class TerminalSessionManager : ITerminalSessionManager
{
    private readonly ConcurrentDictionary<Guid, ITerminalSession> _sessions = new();

    public IEnumerable<ITerminalSession> ActiveSessions => _sessions.Values;

    public Task<ITerminalSession> OpenAsync(Guid hostId, CancellationToken ct = default)
        => throw new NotImplementedException("TerminalSessionManager.OpenAsync");

    public async Task CloseAsync(Guid sessionId)
    {
        if (_sessions.TryRemove(sessionId, out var session))
        {
            await session.DisposeAsync();
        }
    }

    public ITerminalSession? Get(Guid sessionId)
        => _sessions.TryGetValue(sessionId, out var s) ? s : null;
}
