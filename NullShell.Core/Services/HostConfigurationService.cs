using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// 主机配置 CRUD 服务（A）。界面层(ViewModel)调用，底层持久化交给 IHostConfigRepository。
/// TODO: 注入 IHostConfigRepository + ISessionContext(解密密码)。
/// </summary>
public sealed class HostConfigurationService : IHostConfigRepository
{
    private readonly IHostConfigRepository _repository;

    public HostConfigurationService(IHostConfigRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<HostConfig>> GetAllAsync(CancellationToken ct = default) => _repository.GetAllAsync(ct);
    public Task<IReadOnlyList<HostGroup>> GetGroupsAsync(CancellationToken ct = default) => _repository.GetGroupsAsync(ct);
    public Task<HostConfig?> GetByIdAsync(Guid id, CancellationToken ct = default) => _repository.GetByIdAsync(id, ct);
    public Task AddAsync(HostConfig host, CancellationToken ct = default) => _repository.AddAsync(host, ct);
    public Task UpdateAsync(HostConfig host, CancellationToken ct = default) => _repository.UpdateAsync(host, ct);
    public Task DeleteAsync(Guid id, CancellationToken ct = default) => _repository.DeleteAsync(id, ct);
}
