using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// 凭证库实现（最重要）。编排：IConfigStore 持久化 + ICryptoService 加解密 + ISessionContext 解锁态。
/// 所有写操作要求解锁，落盘前自动加密敏感字段。
/// </summary>
public sealed class CredentialVault : ICredentialVault
{
    private readonly IConfigStore _store;
    private readonly ICryptoService _crypto;
    private readonly ISessionContext _session;

    public CredentialVault(IConfigStore store, ICryptoService crypto, ISessionContext session)
    {
        _store = store;
        _crypto = crypto;
        _session = session;
    }

    // ---- 主机 ----
    public async Task<IReadOnlyList<HostConfig>> GetHostsAsync(CancellationToken ct = default)
        => await _store.LoadHostsAsync(ct).ConfigureAwait(false);

    public async Task<HostConfig?> GetHostAsync(Guid id, CancellationToken ct = default)
        => (await GetHostsAsync(ct).ConfigureAwait(false)).FirstOrDefault(h => h.Id == id);

    public async Task SaveHostAsync(HostConfig host, string? plainPassword = null, CancellationToken ct = default)
    {
        EnsureUnlocked();

        if (plainPassword is not null)
        {
            host.EncryptedPassword = Encrypt(plainPassword);
        }

        // 若引用了可复用凭证，校验其存在。
        if (host.CredentialId is { } cid)
        {
            var creds = await _store.LoadCredentialsAsync(ct).ConfigureAwait(false);
            if (creds.All(c => c.Id != cid))
            {
                throw new InvalidOperationException($"引用的凭证 {cid} 不存在。");
            }
        }

        var hosts = (await _store.LoadHostsAsync(ct).ConfigureAwait(false)).ToList();
        int idx = hosts.FindIndex(h => h.Id == host.Id);
        if (idx >= 0) hosts[idx] = host; else hosts.Add(host);
        await _store.SaveHostsAsync(hosts, ct).ConfigureAwait(false);
    }

    public async Task DeleteHostAsync(Guid id, CancellationToken ct = default)
    {
        var hosts = (await _store.LoadHostsAsync(ct).ConfigureAwait(false))
            .Where(h => h.Id != id).ToList();
        await _store.SaveHostsAsync(hosts, ct).ConfigureAwait(false);
    }

    // ---- 可复用凭证 ----
    public async Task<IReadOnlyList<StoredCredential>> GetCredentialsAsync(CancellationToken ct = default)
        => await _store.LoadCredentialsAsync(ct).ConfigureAwait(false);

    public async Task<StoredCredential?> GetCredentialAsync(Guid id, CancellationToken ct = default)
        => (await GetCredentialsAsync(ct).ConfigureAwait(false)).FirstOrDefault(c => c.Id == id);

    public async Task SaveCredentialAsync(StoredCredential credential, string? plainPassword = null, CancellationToken ct = default)
    {
        EnsureUnlocked();

        if (plainPassword is not null)
        {
            credential.EncryptedPassword = Encrypt(plainPassword);
        }

        var creds = (await _store.LoadCredentialsAsync(ct).ConfigureAwait(false)).ToList();
        int idx = creds.FindIndex(c => c.Id == credential.Id);
        if (idx >= 0) creds[idx] = credential; else creds.Add(credential);
        await _store.SaveCredentialsAsync(creds, ct).ConfigureAwait(false);
    }

    public async Task DeleteCredentialAsync(Guid id, CancellationToken ct = default)
    {
        var creds = (await _store.LoadCredentialsAsync(ct).ConfigureAwait(false))
            .Where(c => c.Id != id).ToList();
        await _store.SaveCredentialsAsync(creds, ct).ConfigureAwait(false);
    }

    // ---- 加解密 ----
    public Task<string> EncryptAsync(string plaintext, CancellationToken ct = default)
    {
        EnsureUnlocked();
        return Task.FromResult(Encrypt(plaintext));
    }

    public Task<string> DecryptAsync(string encrypted, CancellationToken ct = default)
    {
        EnsureUnlocked();
        return Task.FromResult(Decrypt(encrypted));
    }

    public Task<bool> ValidateDecryptableAsync(string encrypted, CancellationToken ct = default)
    {
        try
        {
            EnsureUnlocked();
            Decrypt(encrypted);
            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    private string Encrypt(string plaintext)
        => _crypto.Encrypt(GetMasterKey(), plaintext);

    private string Decrypt(string encrypted)
    {
        var key = GetMasterKey();
        try
        {
            return _crypto.Decrypt(key, encrypted);
        }
        finally
        {
            // 密钥由 SessionContext 生命周期统一管理，此处不释放。
        }
    }

    private byte[] GetMasterKey()
        => _session.MasterKey ?? throw new InvalidOperationException("未解锁，无法访问凭据。请先输入主密码。");

    private void EnsureUnlocked()
    {
        if (!_session.IsUnlocked)
        {
            throw new InvalidOperationException("未解锁，无法访问凭据。请先输入主密码。");
        }
    }
}
