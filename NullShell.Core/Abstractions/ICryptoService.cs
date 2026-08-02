namespace NullShell.Core.Abstractions;

/// <summary>
/// 凭据加密存储（F - AES-GCM 加密/解密，配合 CredentialVault 使用）。
/// </summary>
public interface ICryptoService
{
    /// <summary>用主密钥加密明文，返回 Base64。(格式: iv.ciphertext.tag)</summary>
    string Encrypt(byte[] masterKey, string plaintext);

    /// <summary>解密。</summary>
    string Decrypt(byte[] masterKey, string encrypted);
}
