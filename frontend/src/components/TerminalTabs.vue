<script setup lang="ts">
import { useApp } from '../composables/useApp'

const { tabs, activeTab, activateTab, closeTab, newTab, openFiles, openProc, t, serverById, hasConnection, activeTabObj, toast } = useApp()

function tabName(tab: { kind: string; serverId: string }) {
  const s = serverById(tab.serverId)
  const suffix = tab.kind === 'files' ? t('kindSuffixFiles') : tab.kind === 'proc' ? t('kindSuffixProc') : ''
  return s ? s.name + suffix : ''
}
function filesTool() {
  if (hasConnection.value) openFiles(activeTabObj.value!.serverId)
  else toast(t('tConnectFirst'))
}
function procTool() {
  if (hasConnection.value) openProc(activeTabObj.value!.serverId)
  else toast(t('tConnectFirst'))
}
</script>

<template>
  <div class="tabbar flex items-stretch h-10 flex-none bg-surface border-b border-line-soft overflow-hidden">
    <div class="tabs-wrap flex items-stretch overflow-x-auto flex-1 min-w-0">
      <div
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab group/tab flex items-center gap-2 px-3 min-w-[132px] max-w-[190px] shrink-0 border-r border-line-soft text-muted text-[12.5px] border-t-2 border-transparent hover:bg-surface2 transition-colors"
        :class="{ active: i === activeTab }"
        :data-kind="tab.kind"
        @click="activateTab(i)"
      >
        <span v-if="tab.kind === 'term'" class="t-dot size-2 rounded-full shrink-0" :style="{ background: serverById(tab.serverId)?.status === 'online' ? 'var(--success)' : 'var(--muted)' }"></span>
        <svg v-else-if="tab.kind === 'files'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="t-ic size-[15px] shrink-0 text-muted"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="t-ic size-[15px] shrink-0 text-muted"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>
        <span class="t-name flex-1 truncate">{{ tabName(tab) }}</span>
        <button class="t-close size-[17px] shrink-0 rounded-[5px] grid place-items-center text-muted opacity-0 group-hover/tab:opacity-100 hover:bg-surface3 hover:text-fg transition-colors" @click.stop="closeTab(i)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="size-[11px]"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <button class="tab-add w-10 shrink-0 grid place-items-center text-muted border-r border-line-soft hover:bg-surface2 hover:text-accent transition-colors" @click="newTab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" class="size-[15px]"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
    <div class="flex items-center gap-1 px-2 border-l border-line-soft flex-none">
      <button class="tab-tool size-7 rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :title="t('toolFiles')" @click="filesTool">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[15px]"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button class="tab-tool size-7 rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :title="t('toolProc')" @click="procTool">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[15px]"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>
      </button>
    </div>
  </div>
</template>
