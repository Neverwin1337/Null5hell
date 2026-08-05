<script setup lang="ts">
import { useApp } from '../composables/useApp'

const {
  inspectorVisible, isWide,
  activeConnection, sparkBars, cpuLive, memLive, netRx, netTx,
  reconnectAction, openFiles, openProc, t,
} = useApp()
</script>

<template>
  <aside
    v-show="inspectorVisible"
    class="inspector border-l border-line-soft bg-surface overflow-y-auto"
    :class="{ open: inspectorVisible && !isWide }"
    data-od-id="inspector"
  >
    <div v-if="activeConnection" class="p-3.5 flex flex-col gap-4" data-od-id="inspectorBody">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2.5">
          <div class="size-9 rounded-xl shrink-0 bg-surface3 border border-line grid place-items-center font-mono font-semibold text-[13px] text-accent">{{ activeConnection.name.slice(0, 2).toUpperCase() }}</div>
          <div>
            <div class="text-sm font-semibold tracking-[-0.01em]">{{ activeConnection.name }}</div>
            <div class="font-mono text-[11.5px] text-muted tabular-nums">{{ activeConnection.ip }}:{{ activeConnection.port }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 bg-success/12 text-success border border-success/32 px-2 py-0.5 rounded-full text-[11px] font-medium">
            <span class="dot" :class="activeConnection.status"></span>{{ activeConnection.status === 'online' ? t('stConnected') : t('offline') }}
          </span>
          <span v-if="activeConnection.lat != null" class="font-mono text-[11px] text-muted tabular-nums">{{ activeConnection.lat }} ms</span>
          <span class="text-[9.5px] font-medium tracking-[0.06em] px-1.5 py-[1.5px] rounded-[5px] bg-surface2 text-muted font-mono">{{ activeConnection.proto }}</span>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 h-[30px] rounded-md border border-line bg-surface2 text-xs font-medium text-fg flex items-center justify-center gap-1.5 hover:border-accent-dim hover:text-accent transition-colors" @click="reconnectAction">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[13px]"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>{{ t('insReconnect') }}
          </button>
          <button class="flex-1 h-[30px] rounded-md border border-line bg-surface2 text-xs font-medium text-fg flex items-center justify-center gap-1.5 hover:border-accent-dim hover:text-accent transition-colors" @click="openFiles(activeConnection.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[13px]"><path d="M4 20V4M8 16l4-4-4-4M12 16l4-4-4-4"/></svg>{{ t('insSftp') }}
          </button>
          <button class="flex-1 h-[30px] rounded-md border border-line bg-surface2 text-xs font-medium text-fg flex items-center justify-center gap-1.5 hover:border-accent-dim hover:text-accent transition-colors" @click="openProc(activeConnection.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[13px]"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>{{ t('insProc') }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2.5">
        <div class="text-[11px] text-muted tracking-[0.06em] font-medium flex items-center justify-between">
          {{ t('insLoad') }} <span class="font-mono text-[11px]">{{ t('insUptime', { n: activeConnection.uptime }) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs"><span class="text-muted">{{ t('insCpu') }}</span><span class="font-mono text-xs tabular-nums">{{ cpuLive }}%</span></div>
          <div class="h-[5px] rounded-[3px] bg-surface2 overflow-hidden"><i class="block h-full rounded-[3px] bg-accent transition-all duration-[600ms]" :style="{ width: cpuLive + '%' }"></i></div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs"><span class="text-muted">{{ t('insMem') }}</span><span class="font-mono text-xs tabular-nums">{{ memLive }}%</span></div>
          <div class="h-[5px] rounded-[3px] bg-surface2 overflow-hidden"><i class="block h-full rounded-[3px] bg-warn transition-all duration-[600ms]" :style="{ width: memLive + '%' }"></i></div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs"><span class="text-muted">{{ t('insDisk') }}</span><span class="font-mono text-xs tabular-nums">{{ activeConnection.disk }}%</span></div>
          <div class="h-[5px] rounded-[3px] bg-surface2 overflow-hidden"><i class="block h-full rounded-[3px] transition-all duration-[600ms]" :class="activeConnection.disk > 75 ? 'bg-danger' : 'bg-muted'" :style="{ width: activeConnection.disk + '%' }"></i></div>
        </div>
      </div>

      <div class="flex flex-col gap-2.5">
        <div class="text-[11px] text-muted tracking-[0.06em] font-medium flex items-center justify-between">{{ t('insNet') }}</div>
        <div class="flex items-end gap-0.5 h-[30px]">
          <i v-for="(p, i) in sparkBars" :key="i" class="flex-1 rounded-t-[2px] bg-accent opacity-55 min-h-[2px] last:opacity-100" :style="{ height: p + '%' }"></i>
        </div>
        <div class="flex items-center justify-between text-xs"><span class="text-muted">{{ t('insRx') }}</span><span class="font-mono text-xs tabular-nums">{{ netRx }}</span></div>
        <div class="flex items-center justify-between text-xs"><span class="text-muted">{{ t('insTx') }}</span><span class="font-mono text-xs tabular-nums">{{ netTx }}</span></div>
      </div>

      <div class="flex flex-col gap-2.5">
        <div class="text-[11px] text-muted tracking-[0.06em] font-medium flex items-center justify-between">{{ t('insConn') }}</div>
        <div class="flex flex-col">
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insHost') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.ip }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insUser') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.user }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insPort') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.port }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insProto') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.proto }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insEnc') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.enc }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insFp') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.fp }}</span></div>
          <div class="flex justify-between gap-3 py-1.5 border-b border-line-soft text-xs last:border-b-0"><span class="text-muted shrink-0">{{ t('insFs') }}</span><span class="font-mono text-[11.5px] text-right tabular-nums truncate">{{ activeConnection.fs }}</span></div>
        </div>
      </div>
    </div>
  </aside>
</template>
