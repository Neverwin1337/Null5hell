namespace NullShell.Core.Abstractions;

/// <summary>
/// 单个终端会话（B - 终端：PTY、尺寸调整、双向流式）。
/// </summary>
public interface ITerminalSession : IAsyncDisposable
{
    Guid SessionId { get; }

    /// <summary>终端尺寸（列/行）。</summary>
    (int Cols, int Rows) WindowSize { get; set; }

    /// <summary>写入终端输入（键盘/粘贴数据）。</summary>
    Task WriteInputAsync(byte[] data, CancellationToken ct = default);

    /// <summary>调整终端尺寸（resize）。</summary>
    Task ResizeAsync(int cols, int rows, CancellationToken ct = default);

    /// <summary>订阅终端输出流（输出数据 / 断开等事件）。</summary>
    IAsyncEnumerable<byte[]> ReadOutputAsync(CancellationToken ct = default);

    /// <summary>发送中断（Ctrl+C 等价）。</summary>
    Task SendBreakAsync(CancellationToken ct = default);
}
