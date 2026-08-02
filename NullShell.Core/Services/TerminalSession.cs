using NullShell.Core.Abstractions;

namespace NullShell.Core.Services;

/// <summary>
/// 终端会话（B）。基于 Renci.SshNet.ShellStream 实现 PTY、
/// resize(WindowChange 请求)、双向流式读写。
/// TODO: Open 时申请 pty + env(TERM)；WriteInput -> ShellStream.Write；
///       ReadOutput 用 Channel 封装 ShellStream 输出；SendBreak 发 break 请求。
/// </summary>
public sealed class TerminalSession : ITerminalSession
{
    public Guid SessionId { get; } = Guid.NewGuid();
    public (int Cols, int Rows) WindowSize { get; set; } = (120, 30);

    public Task WriteInputAsync(byte[] data, CancellationToken ct = default)
        => throw new NotImplementedException("TerminalSession.WriteInputAsync");

    public Task ResizeAsync(int cols, int rows, CancellationToken ct = default)
        => throw new NotImplementedException("TerminalSession.ResizeAsync");

    public IAsyncEnumerable<byte[]> ReadOutputAsync(CancellationToken ct = default)
        => throw new NotImplementedException("TerminalSession.ReadOutputAsync");

    public Task SendBreakAsync(CancellationToken ct = default)
        => throw new NotImplementedException("TerminalSession.SendBreakAsync");

    public async ValueTask DisposeAsync()
    {
        await Task.CompletedTask;
    }
}
