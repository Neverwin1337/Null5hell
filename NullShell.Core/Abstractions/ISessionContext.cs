namespace NullShell.Core.Abstractions;

/// <summary>
/// 会话隔离（F - 解锁状态下管理内存凭据，锁定时清空）。容器内注入当前解锁态。
/// </summary>
public interface ISessionContext
{
    bool IsUnlocked { get; }

    /// <summary>解锁时会话开始。</summary>
    void Unlock(byte[] masterKey);

    /// <summary>锁定：清空内存密钥与临时凭据。</summary>
    void Lock();

    /// <summary>当前主密钥（仅解锁时非空）。</summary>
    byte[]? MasterKey { get; }
}
