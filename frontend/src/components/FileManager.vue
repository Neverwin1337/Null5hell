<script setup lang="ts">
import { computed } from 'vue'
import { useApp, type FsNode } from '../composables/useApp'

const {
  ICONS, t, toast,
  activeFilesTab, filesServer, filesEntries, filesCrumbs, filesNewItem,
  sortFiles, navTo, upOne, refreshFiles, startNewItem, startRename, cancelNewItem, commitNewItem, deleteEntry,
  openEditor, fmtSize, joinPath, openCtx,
} = useApp()

const fsStatus = computed(() => {
  const s = filesServer.value
  if (!s) return ''
  return t('fsStatus', { a: filesEntries.value.length, b: s.fs, c: s.disk })
})

const newItemValue = computed({
  get: () => (activeFilesTab.value && activeFilesTab.value.newItem ? activeFilesTab.value.newItem.value : ''),
  set: (v: string) => { const tab = activeFilesTab.value; if (tab && tab.newItem) tab.newItem.value = v },
})

function crumbClick(i: number) {
  const segs = filesCrumbs.value
  navTo('/' + segs.slice(0, i + 1).join('/'))
}
function rowDbl(name: string, ent: FsNode) {
  const tab = activeFilesTab.value
  if (!tab) return
  if (ent.k === 'd') navTo(joinPath(tab.fpath, name))
  else openEditor(joinPath(tab.fpath, name), ent)
}
function rowCtx(e: MouseEvent, name: string, ent: FsNode) {
  const tab = activeFilesTab.value
  if (!tab) return
  const items = ent.k === 'd'
    ? [
        { icon: ICONS.folderOpen, label: t('ctxOpen'), fn: () => navTo(joinPath(tab.fpath, name)) },
        { sep: true },
        { icon: ICONS.pencil, label: t('ctxRename'), fn: () => startRename(name, ent) },
        { icon: ICONS.trash, label: t('ctxDelete'), danger: true, fn: () => deleteEntry(name) },
      ]
    : [
        { icon: ICONS.edit, label: t('ctxEdit'), fn: () => openEditor(joinPath(tab.fpath, name), ent) },
        { icon: ICONS.download, label: t('ctxDownload'), fn: () => toast(t('tDownloading', { n: name })) },
        { sep: true },
        { icon: ICONS.pencil, label: t('ctxRename'), fn: () => startRename(name, ent) },
        { icon: ICONS.trash, label: t('ctxDelete'), danger: true, fn: () => deleteEntry(name) },
      ]
  openCtx(e.clientX, e.clientY, items)
}
function listCtx(e: MouseEvent) {
  openCtx(e.clientX, e.clientY, [
    { icon: ICONS.plus, label: t('ctxNewFile'), fn: () => startNewItem('file') },
    { icon: ICONS.folderPlus, label: t('ctxNewDir'), fn: () => startNewItem('dir') },
    { sep: true },
    { icon: ICONS.refresh, label: t('ctxRefresh'), fn: () => refreshFiles() },
  ])
}
</script>

<template>
  <div v-if="activeFilesTab" class="flex-1 min-h-0 flex flex-col bg-surface">
    <div class="flex items-center gap-2.5 px-3 py-2 border-b border-line-soft flex-wrap">
      <div class="flex items-center gap-[3px] flex-1 min-w-0 font-mono text-[12.5px] overflow-hidden whitespace-nowrap">
        <button class="size-[26px] shrink-0 rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :title="t('fUp')" @click="upOne">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </button>
        <button class="font-mono text-[12.5px] text-muted px-1.5 py-[3px] rounded-[5px] hover:bg-surface2 hover:text-accent transition-colors" :class="{ 'last text-fg pointer-events-none': filesCrumbs.length === 0 }" @click="navTo('/')">/</button>
        <template v-for="(sg, i) in filesCrumbs" :key="i">
          <span class="text-line">/</span>
          <button class="font-mono text-[12.5px] text-muted px-1.5 py-[3px] rounded-[5px] hover:bg-surface2 hover:text-accent transition-colors" :class="{ 'last text-fg pointer-events-none': i === filesCrumbs.length - 1 }" @click="crumbClick(i)">{{ sg }}</button>
        </template>
      </div>
      <div class="flex gap-1.5">
        <button class="inline-flex items-center gap-1.5 h-[27px] px-2.5 rounded-md border border-line bg-surface2 text-[11.5px] text-muted hover:border-accent-dim hover:text-accent transition-colors" @click="refreshFiles">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>{{ t('fRefresh') }}
        </button>
        <button class="inline-flex items-center gap-1.5 h-[27px] px-2.5 rounded-md border border-line bg-surface2 text-[11.5px] text-muted hover:border-accent-dim hover:text-accent transition-colors" @click="startNewItem('file')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>{{ t('fNewFile') }}
        </button>
        <button class="inline-flex items-center gap-1.5 h-[27px] px-2.5 rounded-md border border-line bg-surface2 text-[11.5px] text-muted hover:border-accent-dim hover:text-accent transition-colors" @click="startNewItem('dir')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>{{ t('fNewDir') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-[minmax(0,1fr)_92px_148px_100px] gap-2.5 px-3.5 py-[7px] text-[10.5px] tracking-[0.06em] text-muted border-b border-line-soft">
      <button class="text-left cursor-pointer" @click="sortFiles('name')">{{ t('fhName') }}<span v-if="activeFilesTab.fsort.key === 'name'">{{ activeFilesTab.fsort.asc ? ' ↑' : ' ↓' }}</span></button>
      <button class="text-left cursor-pointer" @click="sortFiles('sz')">{{ t('fhSize') }}<span v-if="activeFilesTab.fsort.key === 'sz'">{{ activeFilesTab.fsort.asc ? ' ↑' : ' ↓' }}</span></button>
      <button class="text-left cursor-pointer" @click="sortFiles('md')">{{ t('fhMod') }}<span v-if="activeFilesTab.fsort.key === 'md'">{{ activeFilesTab.fsort.asc ? ' ↑' : ' ↓' }}</span></button>
      <span>{{ t('fhPerm') }}</span>
    </div>

    <div class="flex-1 overflow-y-auto min-h-0 p-1 px-1.5" @contextmenu.prevent.stop="listCtx">
      <div
        v-if="filesNewItem"
        class="grid grid-cols-[minmax(0,1fr)_92px_148px_100px] gap-2.5 items-center px-2 py-1.5 rounded-md text-[12.5px] new-row"
      >
        <span class="flex items-center gap-2 min-w-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-[15px] shrink-0 text-muted"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>
          <input v-model="newItemValue" :placeholder="filesNewItem.kind === 'dir' ? t('phDir') : t('phFile')" autofocus class="flex-1 min-w-0 bg-transparent border-0 outline-0 text-fg caret-accent border-b border-accent-dim" @keydown.enter="commitNewItem" @keydown.esc="cancelNewItem">
        </span>
        <span></span><span></span><span></span>
      </div>

      <div v-for="([name, ent], idx) in filesEntries" :key="name + idx"
        class="grid grid-cols-[minmax(0,1fr)_92px_148px_100px] gap-2.5 items-center px-2 py-1.5 rounded-md text-[12.5px] cursor-default select-none hover:bg-surface2 transition-colors"
        :class="{ 'is-dir': ent.k === 'd' }"
        @dblclick="rowDbl(name, ent)"
        @contextmenu.prevent.stop="rowCtx($event, name, ent)"
      >
        <span class="flex items-center gap-2 min-w-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-[15px] shrink-0" :class="ent.k === 'd' ? 'text-warn' : 'text-muted'"><path v-if="ent.k === 'd'" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><template v-else><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></template></svg>
          <span class="truncate">{{ name }}</span>
        </span>
        <span class="font-mono text-[11.5px] text-muted tabular-nums">{{ ent.k === 'd' ? '—' : fmtSize(ent.sz ?? 0) }}</span>
        <span class="font-mono text-[11.5px] text-muted tabular-nums">{{ ent.md }}</span>
        <span class="font-mono text-[11.5px] text-muted tabular-nums">{{ ent.pm }}</span>
      </div>

      <div v-if="filesEntries.length === 0 && !filesNewItem" class="flex items-center justify-center py-8 text-muted text-[12.5px]">{{ t('emptyDir') }}</div>
    </div>

    <div class="px-3.5 py-1.5 border-t border-line-soft text-[11px] text-muted tabular-nums font-mono">{{ fsStatus }}</div>
  </div>
</template>
