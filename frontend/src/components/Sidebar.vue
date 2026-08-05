<script setup lang="ts">
import { computed } from 'vue'
import { useApp } from '../composables/useApp'

const {
  GROUPS_DEFAULT, ICONS,
  search, sidebarGroups, isCollapsed, toggleGroup,
  groupEdit, groupInput, startNewGroup, startRenameGroup, commitGroupEdit, cancelGroupEdit,
  deleteGroupAction, openServer, tabs, activeTab, t, openCtx, openAddModal,
} = useApp()

const activeServerId = computed(() => {
  const tab = tabs.value[activeTab.value]
  return tab ? tab.serverId : null
})
const noResults = computed(() => sidebarGroups.value.length === 0 && search.value.trim() !== '')

function onGroupCtx(e, name) {
  if (GROUPS_DEFAULT.includes(name)) {
    openCtx(e.clientX, e.clientY, [{ icon: ICONS.folderPlus, label: t('ctxNewGroup'), fn: startNewGroup }])
    return
  }
  openCtx(e.clientX, e.clientY, [
    { icon: ICONS.folderPlus, label: t('ctxNewGroup'), fn: startNewGroup },
    { sep: true },
    { icon: ICONS.pencil, label: t('ctxRenameGroup'), fn: () => startRenameGroup(name) },
    { icon: ICONS.trash, label: t('ctxDeleteGroup'), danger: true, fn: () => deleteGroupAction(name) },
  ])
}
function onListCtx(e) {
  if (e.target.closest('.srv') || e.target.closest('.group-input')) return
  openCtx(e.clientX, e.clientY, [{ icon: ICONS.folderPlus, label: t('ctxNewGroup'), fn: startNewGroup }])
}
</script>

<template>
  <aside class="sidebar flex flex-col min-h-0 border-r border-line-soft" data-od-id="sidebar">
    <div class="p-3.5 pb-2.5 flex gap-2">
      <div class="search flex-1 min-w-0 flex items-center gap-[7px] bg-surface2 border border-line rounded-md px-2.5 h-8 text-muted focus-within:border-accent-dim focus-within:shadow-[0_0_0_3px_var(--ring)] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" class="size-3.5 shrink-0"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input v-model="search" type="text" :placeholder="t('searchPh')" :aria-label="t('searchPh')" autocomplete="off" class="flex-1 min-w-0 bg-transparent border-0 outline-0 text-fg text-[12.5px] placeholder:text-muted">
      </div>
      <button class="size-8 shrink-0 rounded-md border border-dashed border-line text-muted grid place-items-center hover:text-accent hover:border-accent-dim hover:bg-accent/12 transition-all" :aria-label="t('atlAdd')" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="size-[15px]"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>

    <div class="side-scroll flex-1 overflow-y-auto px-2 pb-2.5 pt-0.5" @contextmenu.prevent.stop="onListCtx">
      <div v-if="groupEdit && groupEdit.mode === 'new'" class="group-input flex items-center gap-[7px] p-1.5 px-2 mb-0.5 rounded-md bg-surface2 border border-line focus-within:border-accent-dim focus-within:shadow-[0_0_0_3px_var(--ring)] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[13px] text-muted shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>
        <input v-model="groupInput" :placeholder="t('phNewGroup')" autocomplete="off" autofocus class="flex-1 min-w-0 bg-transparent border-0 outline-0 text-fg text-[12.5px] caret-accent" @keydown.enter="commitGroupEdit" @keydown.esc="cancelGroupEdit">
      </div>

      <div v-for="g in sidebarGroups" :key="g.name" class="group" :class="{ collapsed: isCollapsed(g.name) }">
        <div v-if="g.editing" class="group-input flex items-center gap-[7px] p-1.5 px-2 mb-0.5 rounded-md bg-surface2 border border-line focus-within:border-accent-dim focus-within:shadow-[0_0_0_3px_var(--ring)] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-[13px] text-muted shrink-0"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          <input v-model="groupInput" :placeholder="t('phNewGroup')" autocomplete="off" autofocus class="flex-1 min-w-0 bg-transparent border-0 outline-0 text-fg text-[12.5px] caret-accent" @keydown.enter="commitGroupEdit" @keydown.esc="cancelGroupEdit">
        </div>
        <template v-else>
          <button
            class="group-h w-full flex items-center gap-1.5 p-1.5 rounded-md text-[11px] text-muted tracking-[0.06em] text-left hover:bg-surface2 hover:text-fg transition-colors"
            @click="toggleGroup(g.name)"
            @contextmenu.prevent.stop="onGroupCtx($event, g.name)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="size-[11px] transition-transform"><polyline points="6 9 12 15 18 9"/></svg>
            {{ g.label }}
            <span class="ml-auto font-mono text-[10.5px] text-muted">{{ g.count }}</span>
          </button>
          <div class="group-items">
            <button
              v-for="s in g.items"
              :key="s.id"
              class="srv w-full flex items-center gap-2.5 p-2 rounded-md mb-px text-left border border-transparent hover:bg-surface2 transition-colors"
              :class="{ active: s.id === activeServerId, fav: s.fav }"
              @click="openServer(s.id)"
            >
              <span class="dot" :class="s.status"></span>
              <span class="srv-main min-w-0 flex-1">
                <span class="srv-name block text-[12.5px] font-[510] truncate">{{ s.name }}</span>
                <span class="srv-ip block font-mono text-[11px] text-muted tabular-nums truncate">{{ s.ip }}:{{ s.port }}</span>
              </span>
              <span class="srv-meta flex items-center gap-1.5 shrink-0">
                <span class="text-[9.5px] font-medium tracking-[0.06em] px-1.5 py-[1.5px] rounded-[5px] bg-surface2 text-muted font-mono">{{ s.proto }}</span>
                <span v-if="s.lat != null" class="font-mono text-[10.5px] text-muted tabular-nums">{{ s.lat }}ms</span>
                <span v-else class="font-mono text-[10.5px] text-muted">{{ t('offlineTag') }}</span>
              </span>
            </button>
          </div>
        </template>
      </div>

      <div v-if="noResults" class="side-empty py-6 px-4 text-center text-xs text-muted leading-relaxed">{{ t('noResults') }}</div>
    </div>

    <div class="p-2 border-t border-line-soft">
      <button class="btn-new w-full h-[34px] rounded-md bg-accent text-accent-ink font-medium text-[12.5px] tracking-[0.02em] flex items-center justify-center gap-[7px] shadow-[0_6px_18px_-8px_var(--shadow-accent)] hover:brightness-105 active:translate-y-px transition-[filter,transform]" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-[15px]"><path d="M12 5v14M5 12h14"/></svg>
        <span>{{ t('addServer') }}</span>
      </button>
    </div>
  </aside>
</template>
