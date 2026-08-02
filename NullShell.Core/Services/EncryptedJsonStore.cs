using System.Text.Json;
using System.Text.Json.Serialization;
using NullShell.Core.Abstractions;
using NullShell.Core.Models;

namespace NullShell.Core.Services;

/// <summary>
/// JSON 文件持久化存储（最重要：多主机凭证真实落盘）。
/// 单文件: {dataDir}/config.json = { version, hosts[], credentials[] }。
/// 字段在写入前已由 CredentialVault 加密，本类只做纯 IO，采用原子写(临时文件+替换)。
/// </summary>
public sealed class EncryptedJsonStore : IConfigStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public EncryptedJsonStore(string? dataDir = null)
    {
        string dir = dataDir ?? AppDataDir();
        Directory.CreateDirectory(dir);
        _filePath = Path.Combine(dir, "config.json");
    }

    public async Task<IReadOnlyList<HostConfig>> LoadHostsAsync(CancellationToken ct = default)
        => (await LoadAsync(ct).ConfigureAwait(false)).Hosts;

    public Task SaveHostsAsync(IReadOnlyList<HostConfig> hosts, CancellationToken ct = default)
        => MutateAsync(doc => { doc.Hosts = hosts.ToList(); return doc; }, ct);

    public async Task<IReadOnlyList<StoredCredential>> LoadCredentialsAsync(CancellationToken ct = default)
        => (await LoadAsync(ct).ConfigureAwait(false)).Credentials;

    public Task SaveCredentialsAsync(IReadOnlyList<StoredCredential> credentials, CancellationToken ct = default)
        => MutateAsync(doc => { doc.Credentials = credentials.ToList(); return doc; }, ct);

    private async Task<StoreDocument> LoadAsync(CancellationToken ct)
    {
        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (!File.Exists(_filePath))
            {
                return new StoreDocument();
            }

            await using var fs = new FileStream(_filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var doc = await JsonSerializer.DeserializeAsync<StoreDocument>(fs, JsonOptions, ct).ConfigureAwait(false);
            return doc ?? new StoreDocument();
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task MutateAsync(Func<StoreDocument, StoreDocument> mutate, CancellationToken ct)
    {
        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var doc = File.Exists(_filePath)
                ? await LoadUnlockedAsync(ct).ConfigureAwait(false)
                : new StoreDocument();
            doc = mutate(doc);

            string tmp = _filePath + ".tmp";
            await using (var fs = new FileStream(tmp, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await JsonSerializer.SerializeAsync(fs, doc, JsonOptions, ct).ConfigureAwait(false);
            }

            File.Move(tmp, _filePath, overwrite: true);
        }
        finally
        {
            _gate.Release();
        }
    }

    // 仅在被 _gate 保护下调用（MutateAsync 内已持有锁）。
    private async Task<StoreDocument> LoadUnlockedAsync(CancellationToken ct)
    {
        await using var fs = new FileStream(_filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return await JsonSerializer.DeserializeAsync<StoreDocument>(fs, JsonOptions, ct).ConfigureAwait(false)
               ?? new StoreDocument();
    }

    private static string AppDataDir()
        => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "NullShell");

    private sealed class StoreDocument
    {
        public int Version { get; set; } = 1;
        public List<HostConfig> Hosts { get; set; } = new();
        public List<StoredCredential> Credentials { get; set; } = new();
    }
}
