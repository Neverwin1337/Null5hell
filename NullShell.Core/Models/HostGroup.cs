namespace NullShell.Core.Models;

/// <summary>
/// 主机分组（用于连接管理界面分组展示）。
/// </summary>
public sealed class HostGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}
