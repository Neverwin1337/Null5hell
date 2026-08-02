using System.Security.Cryptography;
using NullShell.Core.Abstractions;

namespace NullShell.Core.Services;

/// <summary>
/// 会话上下文（F）。持有当前解锁后的主密钥，锁定即清空。
/// 由解锁流程(UI)调用 Unlock(MasterKey)；锁定调用 Lock()。
/// </summary>
public sealed class SessionContext : ISessionContext
{
    private byte[]? _masterKey;

    public bool IsUnlocked => _masterKey is not null;

    public byte[]? MasterKey => _masterKey;

    public void Unlock(byte[] masterKey)
    {
        _masterKey = masterKey;
    }

    public void Lock()
    {
        if (_masterKey is not null)
        {
            CryptographicOperations.ZeroMemory(_masterKey);
        }
        _masterKey = null;
    }
}
