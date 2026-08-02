using System.Security.Cryptography;
using System.Text;
using NullShell.Core.Abstractions;

namespace NullShell.Core.Services;

/// <summary>
/// 凭据加密（F）。AES-256-GCM。
/// 序列化格式: iv(12) | tag(16) | ciphertext，整体 Base64。
/// </summary>
public sealed class CryptoService : ICryptoService
{
    private const int NonceSize = 12;
    private const int TagSize = 16;

    /// <summary>
    /// 用 256 位主密钥加密明文，返回 Base64(iv|tag|ciphertext)。
    /// </summary>
    public string Encrypt(byte[] masterKey, string plaintext)
    {
        ArgumentNullException.ThrowIfNull(masterKey);
        if (masterKey.Length != 32)
        {
            throw new ArgumentException("主密钥必须是 32 字节 (AES-256)。", nameof(masterKey));
        }

        byte[] nonce = RandomNumberGenerator.GetBytes(NonceSize);
        byte[] plain = Encoding.UTF8.GetBytes(plaintext);
        byte[] cipher = new byte[plain.Length];
        byte[] tag = new byte[TagSize];

        using var aes = new AesGcm(masterKey, TagSize);
        aes.Encrypt(nonce, plain, cipher, tag);

        var result = new byte[NonceSize + TagSize + cipher.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
        Buffer.BlockCopy(cipher, 0, result, NonceSize + TagSize, cipher.Length);
        return Convert.ToBase64String(result);
    }

    /// <summary>
    /// 解密 Base64(iv|tag|ciphertext)。认证失败会抛 CryptographicException。
    /// </summary>
    public string Decrypt(byte[] masterKey, string encrypted)
    {
        ArgumentNullException.ThrowIfNull(masterKey);
        if (masterKey.Length != 32)
        {
            throw new ArgumentException("主密钥必须是 32 字节 (AES-256)。", nameof(masterKey));
        }

        byte[] data = Convert.FromBase64String(encrypted);
        if (data.Length < NonceSize + TagSize)
        {
            throw new CryptographicException("密文格式不正确。");
        }

        var nonce = new byte[NonceSize];
        var tag = new byte[TagSize];
        int cipherLen = data.Length - NonceSize - TagSize;
        var cipher = new byte[cipherLen];
        Buffer.BlockCopy(data, 0, nonce, 0, NonceSize);
        Buffer.BlockCopy(data, NonceSize, tag, 0, TagSize);
        Buffer.BlockCopy(data, NonceSize + TagSize, cipher, 0, cipherLen);

        var plain = new byte[cipherLen];
        using var aes = new AesGcm(masterKey, TagSize);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }
}
