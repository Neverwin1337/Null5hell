using System.Security.Cryptography;
using System.Text;
using NullShell.Core.Abstractions;

namespace NullShell.Core.Services;

/// <summary>
/// 主密码保护（F）。真实实现：
///  - 首次设置：生成 16B 随机盐，PBKDF2-SHA256 派生验证哈希并落盘（salt:verifier）。
///  - 校验：重算后 FixedTimeEquals 恒时比对。
///  - 派生主密钥：用同一盐 PBKDF2 派生 32B AES-256 密钥。
/// 磁盘文件: {dataDir}/master.dat = base64(salt):base64(verifier)
/// </summary>
public sealed class MasterPasswordService : IPasswordProtection
{
    private const int SaltSize = 16;
    private const int VerifierSize = 32;
    private const int KeySize = 32; // AES-256
    private const int Iterations = 210_000;
    private static readonly HashAlgorithmName Hash = HashAlgorithmName.SHA256;

    private readonly string _dataDir;
    private readonly string _filePath;

    public MasterPasswordService(string? dataDir = null)
    {
        _dataDir = dataDir ?? AppDataDir();
        _filePath = Path.Combine(_dataDir, "master.dat");
    }

    public bool IsMasterPasswordSet => File.Exists(_filePath);

    public Task SetMasterPasswordAsync(string password, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        Directory.CreateDirectory(_dataDir);

        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] verifier = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Hash, VerifierSize);

        string line = Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(verifier);
        File.WriteAllText(_filePath, line, Encoding.UTF8);
        return Task.CompletedTask;
    }

    public Task<bool> VerifyAsync(string password, CancellationToken ct = default)
    {
        if (!IsMasterPasswordSet)
        {
            return Task.FromResult(false);
        }

        (byte[] salt, byte[] verifier) = Load();
        byte[] candidate = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Hash, VerifierSize);
        return Task.FromResult(CryptographicOperations.FixedTimeEquals(candidate, verifier));
    }

    public Task<byte[]> DeriveKeyAsync(string password, CancellationToken ct = default)
    {
        if (!IsMasterPasswordSet)
        {
            throw new InvalidOperationException("尚未设置主密码。");
        }

        (byte[] salt, _) = Load();
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Hash, KeySize);
        return Task.FromResult(key);
    }

    public Task LockAsync(CancellationToken ct = default)
    {
        // 本实现不缓存密钥；主密钥由 SessionContext 持有并在 Lock 时清零。
        return Task.CompletedTask;
    }

    private (byte[] Salt, byte[] Verifier) Load()
    {
        string line = File.ReadAllText(_filePath, Encoding.UTF8);
        string[] parts = line.Split(':');
        if (parts.Length != 2)
        {
            throw new InvalidDataException("主密码文件损坏。");
        }

        return (Convert.FromBase64String(parts[0]), Convert.FromBase64String(parts[1]));
    }

    private static string AppDataDir()
        => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "NullShell");
}
