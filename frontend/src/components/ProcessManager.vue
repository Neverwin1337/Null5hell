<script setup lang="ts">
import { computed } from 'vue'
import { useApp } from '../composables/useApp'

const { activeProcTab, procServer, procRows, sortProc, refreshProcs, killProc, procHeat, t } = useApp()

const PCOL = computed(() => ({
  name: t('pcName'), pid: 'PID', user: t('pcUser'), cpu: 'CPU %', mem: t('pcMem'), gpu: t('pcGpu'), exe: t('pcExe'), pm: t('pcPm'),
}))

function headSortIcon(key: string) {
  if (!activeProcTab.value || activeProcTab.value.psort.key !== key) return ''
  return activeProcTab.value.psort.asc ? ' ↑' : ' ↓'
}
</script>

<template>
  <div v-if="activeProcTab" class="flex-1 min-h-0 flex flex-col bg-surface">
    <div class="flex items-center gap-2.5 px-3 py-2 border-b border-line-soft">
      <span class="text-xs font-medium tracking-[0.02em]">{{ t('ptTitle') }}</span>
      <span class="font-mono text-[11px] text-muted">{{ procRows.length }} / {{ activeProcTab.procs.length }}</span>
      <div class="flex items-center gap-1.5 ml-auto bg-surface2 border border-line rounded-md px-2 h-[27px] text-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" class="size-3"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input v-model="activeProcTab.psearch" :placeholder="t('ptSearch')" autocomplete="off" class="bg-transparent border-0 outline-0 text-fg text-xs w-[150px]">
      </div>
      <button class="inline-flex items-center gap-1.5 h-[27px] px-2.5 rounded-md border border-line bg-surface2 text-[11.5px] text-muted hover:border-accent-dim hover:text-accent transition-colors" @click="refreshProcs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>{{ t('fRefresh') }}
      </button>
    </div>

    <div class="flex-1 overflow-auto min-h-0">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th v-for="(label, key) in PCOL" :key="key"
              class="sticky top-0 bg-surface2 text-left text-[10.5px] tracking-[0.06em] text-muted px-2.5 py-[7px] whitespace-nowrap cursor-pointer select-none border-b border-line hover:text-fg transition-colors"
              :class="{ 'text-accent': activeProcTab.psort.key === key }"
              @click="sortProc(key)"
            >{{ label }}{{ headSortIcon(key) }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in procRows" :key="p.pid" class="hover:bg-surface2 transition-colors">
            <td class="px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">
              <span class="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-[13px] text-muted"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>
                {{ p.name }}
              </span>
            </td>
            <td class="font-mono text-[11.5px] text-muted px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">{{ p.pid }}</td>
            <td class="font-mono text-[11.5px] text-muted px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">{{ p.user }}</td>
            <td class="px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">
              <span class="flex items-center gap-1.5" :class="procHeat(p.cpu)">
                <span class="w-[42px] h-1 rounded-[2px] bg-surface3 overflow-hidden"><i class="block h-full bg-accent" :style="{ width: Math.min(100, p.cpu) + '%' }"></i></span>
                <span class="font-mono text-[11.5px] text-muted">{{ p.cpu.toFixed(1) }}%</span>
              </span>
            </td>
            <td class="font-mono text-[11.5px] text-muted px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">{{ p.mem.toFixed(1) }}%</td>
            <td class="font-mono text-[11.5px] text-muted px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">{{ p.gpu ? p.gpu.toFixed(1) + '%' : '—' }}</td>
            <td class="max-w-[250px] truncate text-muted font-mono text-[11px] px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap" :title="p.exe">{{ p.exe }}</td>
            <td class="font-mono text-[11.5px] text-muted px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">{{ p.pm }}</td>
            <td class="px-2.5 py-1.5 border-b border-line-soft whitespace-nowrap">
              <button class="h-[22px] px-2.5 rounded-[5px] text-[11px] text-muted border border-line hover:text-danger hover:border-danger hover:bg-danger/14 transition-colors" @click="killProc(p.pid)">{{ t('ptKill') }}</button>
            </td>
          </tr>
          <tr v-if="procRows.length === 0">
            <td colspan="9" class="text-center text-muted py-6 px-2.5">{{ t('noProcs') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
