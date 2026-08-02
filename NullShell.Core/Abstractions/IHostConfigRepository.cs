using NullShell.Core.Models;

namespace NullShell.Core.Abstractions;

/// <summary>
/// 主机配置的持久化仓储（A - 连接核心 CRUD）。
/// </summary>
public interface IHostConfigRepository
{
    Task<IReadOnlyList<HostConfig>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<HostGroup>> GetGroupsAsync(CancellationToken ct = default);
    Task<HostConfig?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(HostConfig host, CancellationToken ct = default);
    Task UpdateAsync(HostConfig host, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
