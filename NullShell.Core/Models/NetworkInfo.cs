namespace NullShell.Core.Models;

/// <summary>
/// 网络状况（E - 系统监控：网卡流量、连接数、端口监听）。
/// </summary>
public sealed class NetworkInfo
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public IReadOnlyList<NetworkInterfaceMetrics>? Interfaces { get; set; }
    public int TcpConnectionCount { get; set; }
    public IReadOnlyList<ListeningPort>? ListeningPorts { get; set; }
}

public sealed class NetworkInterfaceMetrics
{
    public string Name { get; set; } = string.Empty;
    public long RxBytesPerSecond { get; set; }
    public long TxBytesPerSecond { get; set; }
    public long RxTotalBytes { get; set; }
    public long TxTotalBytes { get; set; }
}

public sealed class ListeningPort
{
    public string Protocol { get; set; } = string.Empty; // tcp / tcp6 / udp
    public int Port { get; set; }
    public string Address { get; set; } = string.Empty;
    public string ProcessName { get; set; } = string.Empty;
}
