<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Window } from '@wailsio/runtime'
import { useApp } from './composables/useApp'
import Sidebar from './components/Sidebar.vue'
import TerminalTabs from './components/TerminalTabs.vue'
import TerminalView from './components/TerminalView.vue'
import FileManager from './components/FileManager.vue'
import ProcessManager from './components/ProcessManager.vue'
import Inspector from './components/Inspector.vue'
import ContextMenu from './components/ContextMenu.vue'

const {
  THEMES,
  lang, toggleLang, t, tGroup, themeI18nKey,
  theme, setTheme, themePopOpen,
  groups,
  tabs, activeTab, activeConnection, hasConnection, activeKind,
  openTab, closeTab, newTab,
  inspectorVisible, isWide, mainGrid, statusConnection, netRxStatus, netTxStatus, clock,
  showCloseModal, showAddModal, showEditModal, addForm, addProto, addAuth,
  openAddModal, submitAdd, confirmClose, editorContent, editorMeta, editingTitle, editingPath, editingPerm, saveEditor, closeEditor,
  minimized, minimize, restore, disconnected, panelOpen, togglePanel, demoConnect,
  toasts, closeCtx,
  tick, toast, applyTheme,
} = useApp()

const themeWrap = ref(null)

const addGroupOptions = computed(() => groups.value.filter(g => g !== '常用伺服器'))

let interval: ReturnType<typeof setInterval> | null = null

function onDocClick(e: MouseEvent) {
  closeCtx()
  const wrap = themeWrap.value as HTMLElement | null
  if (wrap && !wrap.contains(e.target as Node)) themePopOpen.value = false
}
function onGlobalCtx(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.ctx-menu')) closeCtx()
}
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') { e.preventDefault(); newTab() }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(activeTab.value) }
  if (e.key === 'Escape') { closeCtx(); themePopOpen.value = false }
}
function onResize() { isWide.value = window.innerWidth > 980 }

function closeApp() {
  // In the Wails runtime this closes the app window; outside it (browser dev)
  // we fall back to dropping all connections.
  Window.Close().catch(() => confirmClose())
}

onMounted(() => {
  applyTheme()
  document.documentElement.lang = lang.value === 'en' ? 'en' : 'zh-TW'
  document.title = t('appTitle')
  if (!tabs.value.length) openTab('prod-app-01')
  interval = setInterval(tick, 1500)
  tick()
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('contextmenu', onGlobalCtx)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('contextmenu', onGlobalCtx)
  window.removeEventListener('resize', onResize)
})
watch(lang, () => {
  document.documentElement.lang = lang.value === 'en' ? 'en' : 'zh-TW'
  document.title = t('appTitle')
})
</script>

<template>
  <div class="h-full">
    <!-- toasts -->
    <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
      <div v-for="toast in toasts" :key="toast.id" class="toast bg-surface3 border border-line text-fg px-3.5 py-2 rounded-full text-[12.5px] shadow-[0_10px_30px_-10px_var(--shadow-color)]">{{ toast.msg }}</div>
    </div>

    <!-- minbar -->
    <div v-if="minimized" class="minbar show fixed bottom-[18px] left-1/2 -translate-x-1/2 z-[55] flex items-center gap-2.5 rounded-full bg-surface3 border border-line px-4 py-2 text-[12.5px] shadow-[0_14px_40px_-10px_var(--shadow-color)]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="text-accent size-[15px]"><rect x="2" y="3" width="20" height="14" rx="3"/><path d="M8 21h8M12 17v4"/></svg>
      <span>{{ t('minMin') }}</span>
      <button class="text-xs font-medium text-accent px-2.5 py-[3px] rounded-full bg-accent/12 hover:bg-accent/24 transition-colors" @click="restore">{{ t('restore') }}</button>
    </div>

    <ContextMenu />

    <div class="desktop p-3 h-full flex">
      <div class="window relative flex-1 bg-surface border border-line rounded-lg shadow-[0_24px_60px_-18px_var(--shadow-color)] grid grid-rows-[48px_1fr_30px] overflow-hidden transition-[transform,opacity] duration-[320ms] ease-[cubic-bezier(.2,.7,.3,1)]" :class="{ minimized, disconnected }">
        <!-- titlebar -->
        <header class="flex items-center gap-3.5 px-3.5 border-b border-line-soft select-none" data-od-id="titlebar">
          <div class="traffic flex gap-2">
            <button class="tl tl-close size-3 rounded-full bg-danger relative grid place-items-center" :aria-label="t('atlClose')" @click="showCloseModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" class="size-[7px]"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <button class="tl tl-min size-3 rounded-full bg-warn relative grid place-items-center" :aria-label="t('atlMin')" @click="minimize">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" class="size-[7px]"><path d="M5 12h14"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 font-[560] tracking-[0.01em] text-[13px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-accent"><path d="M4 17l6-6-6-6M12 19h8"/></svg>
            <span>SSH Workbench</span>
            <span class="text-muted font-normal">/ <b class="text-fg font-[560]">{{ statusConnection.name }}</b></span>
          </div>
          <div class="flex-1"></div>
          <div class="flex gap-1.5">
            <button class="h-[26px] px-2.5 rounded-md border border-line bg-surface2 text-muted text-[11px] font-medium tracking-[0.04em] hover:border-accent-dim hover:text-accent transition-colors" :title="t('langTitle')" @click="toggleLang">{{ lang === 'en' ? '中' : 'EN' }}</button>
            <div ref="themeWrap" class="relative">
              <button class="icon-btn size-[30px] rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :class="{ open: themePopOpen }" :aria-label="t('atlTheme')" :aria-expanded="themePopOpen" aria-haspopup="menu" @click.stop="themePopOpen = !themePopOpen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>
              </button>
              <div v-if="themePopOpen" class="absolute right-0 top-full mt-2 z-[95] w-[196px] bg-surface3 border border-line rounded-xl p-1.5 shadow-[0_16px_40px_-12px_var(--shadow-color)]">
                <div class="flex items-center justify-between px-2 pb-2 pt-1.5"><span class="text-[10.5px] tracking-[0.08em] text-muted">{{ t('thLabel') }}</span></div>
                <button v-for="id in THEMES" :key="id" class="w-full flex items-center gap-2.5 px-2 py-[7px] rounded-[9px] text-left hover:bg-surface2 transition-colors" :class="theme === id ? 'bg-surface2' : ''" role="menuitemradio" :aria-checked="theme === id" @click="setTheme(id)">
                  <span class="tp-swatch" :class="'s-' + id"></span>
                  <span class="flex-1 text-[12.5px]" :class="theme === id ? 'text-accent' : 'text-fg'">{{ t(themeI18nKey(id)) }}</span>
                  <span class="text-[9.5px] tracking-[0.06em] text-muted font-mono">{{ t(id === 'midnight' || id === 'ember' ? 'thDark' : 'thLight') }}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 text-accent" :class="theme === id ? 'opacity-100' : 'opacity-0'"><path d="M20 6L9 17l-5-5"/></svg>
                </button>
              </div>
            </div>
            <button class="icon-btn size-[30px] rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :class="{ active: panelOpen }" :aria-label="t('atlPanel')" @click="togglePanel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>
            </button>
            <button class="icon-btn size-[30px] rounded-md grid place-items-center text-muted hover:bg-surface2 hover:text-fg transition-colors" :aria-label="t('atlSettings')" @click="toast(t('tSettings'))">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </header>

        <!-- main -->
        <div class="main grid min-h-0 flex-1" :style="{ gridTemplateColumns: mainGrid }">
          <Sidebar />
          <section class="terminal-pane flex flex-col min-h-0 min-w-0 bg-term" data-od-id="terminal">
            <TerminalTabs />
            <div class="term flex-1 min-h-0 flex flex-col">
              <TerminalView v-if="activeKind === 'term'" />
              <div v-else-if="!hasConnection" class="term-empty flex-1 flex flex-col items-center justify-center gap-3.5 text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="size-10 opacity-50"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                <p class="text-sm font-semibold text-fg tracking-[-0.01em]">{{ t('emptyTitle') }}</p>
                <div class="flex gap-2.5">
                  <button class="h-[34px] px-4 rounded-md bg-accent text-accent-ink font-medium text-[12.5px] hover:brightness-105 transition-[filter]" @click="openAddModal">{{ t('emptyAdd') }}</button>
                  <button class="h-[34px] px-4 rounded-md bg-surface2 border border-line text-[12.5px] text-fg hover:border-accent-dim hover:text-accent transition-colors" @click="demoConnect">{{ t('emptyDemo') }}</button>
                </div>
                <span class="text-[11.5px] text-muted tracking-[0.02em]">{{ t('emptyHint') }}</span>
              </div>
              <FileManager v-else-if="activeKind === 'files'" />
              <ProcessManager v-else-if="activeKind === 'proc'" />
            </div>
          </section>
          <Inspector />
        </div>

        <!-- statusbar -->
        <footer class="flex items-center gap-[18px] px-3.5 text-[11.5px] text-muted border-t border-line-soft bg-surface whitespace-nowrap overflow-hidden" data-od-id="statusbar">
          <div class="flex items-center gap-1.5">
            <span class="dot" :class="activeConnection ? activeConnection.status : 'offline'"></span>
            <span class="font-mono tabular-nums">{{ statusConnection.name }}</span>
            <span>·</span>
            <span :style="{ color: statusConnection.on ? 'var(--success)' : 'var(--muted)' }">{{ statusConnection.on ? t('stConnected') : t('stOffline') }}</span>
          </div>
          <div class="w-px h-3.5 bg-line shrink-0"></div>
          <div class="flex items-center gap-1.5">
            <span class="text-success">▼ RX</span><span class="font-mono tabular-nums">{{ netRxStatus }}</span>
            <span class="text-accent">▲ TX</span><span class="font-mono tabular-nums">{{ netTxStatus }}</span>
          </div>
          <div class="w-px h-3.5 bg-line shrink-0"></div>
          <div class="flex items-center gap-1.5"><span class="font-mono tabular-nums">{{ statusConnection.ping }}</span></div>
          <div class="flex-1"></div>
          <div class="flex items-center gap-1.5"><span class="font-mono tabular-nums">{{ clock }}</span></div>
          <div class="w-px h-3.5 bg-line shrink-0"></div>
          <div class="flex items-center gap-1.5"><span class="font-mono text-[10.5px] text-muted border border-line border-b-2 rounded px-1.5">Ctrl</span>+<span class="font-mono text-[10.5px] text-muted border border-line border-b-2 rounded px-1.5">T</span> <span>{{ t('sbNewTab') }}</span></div>
          <div class="flex items-center gap-1.5"><span class="font-mono text-[10.5px] text-muted border border-line border-b-2 rounded px-1.5">Cmd</span>+<span class="font-mono text-[10.5px] text-muted border border-line border-b-2 rounded px-1.5">R</span> <span>{{ t('sbReconnect') }}</span></div>
        </footer>

        <!-- disconnected overlay -->
        <div v-if="disconnected" class="absolute inset-0 z-40 bg-surface flex flex-col items-center justify-center gap-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="size-11 text-danger"><path d="M18 6a8 8 0 0 0-12 .7M18 11v1a4 4 0 0 1-1.5 3.1M13.5 15H6a4 4 0 0 1-4-4v-1"/><path d="M12 6V3M3 5l18 14M8 8l13 13" stroke="currentColor"/></svg>
          <h2 class="text-lg font-semibold tracking-[-0.01em]">{{ t('discTitle') }}</h2>
          <p class="text-muted text-[13px]"><span>{{ t('discPre') }}</span> <span class="font-mono">{{ activeConnection ? activeConnection.name : '—' }}</span> <span>{{ t('discPost') }}</span></p>
          <button class="h-9 px-5 rounded-md bg-accent text-accent-ink font-medium text-[13px] hover:brightness-105 transition-[filter]" @click="disconnected = false; toast(t('tRestored'))">{{ t('reconnect') }}</button>
        </div>
      </div>
    </div>

    <!-- close modal -->
    <div v-if="showCloseModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-scrim backdrop-blur-[3px]" @click.self="showCloseModal = false">
      <div class="modal w-[340px] bg-surface border border-line rounded-lg p-5 shadow-[0_30px_80px_-20px_var(--shadow-color)]">
        <h3 class="text-[15px] font-semibold tracking-[-0.01em] mb-2">{{ t('closeTitle') }}</h3>
        <p class="text-[13px] text-muted mb-[18px]">{{ t('closeBody') }}</p>
        <div class="flex justify-end gap-2.5">
          <button class="h-8 px-3.5 rounded-md text-[12.5px] text-muted hover:bg-surface2 hover:text-fg transition-colors" @click="showCloseModal = false">{{ t('cancel') }}</button>
          <button class="h-8 px-4 rounded-md bg-danger text-danger-ink font-medium text-[12.5px] hover:brightness-110 transition-[filter]" @click="closeApp">{{ t('closeConfirm') }}</button>
        </div>
      </div>
    </div>

    <!-- add server modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-scrim backdrop-blur-[3px]" @click.self="showAddModal = false">
      <div class="modal w-[460px] max-w-[92vw] bg-surface border border-line rounded-lg p-5 shadow-[0_30px_80px_-20px_var(--shadow-color)]">
        <h3 class="text-[15px] font-semibold tracking-[-0.01em] mb-2">{{ t('addTitle') }}</h3>
        <p class="text-[13px] text-muted mb-[18px]">{{ t('addBody') }}</p>
        <div class="grid grid-cols-2 gap-3 mb-[18px]">
          <div class="flex flex-col gap-1.5"><label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblName') }}</label><input v-model="addForm.name" :placeholder="t('phName')" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors caret-accent"></div>
          <div class="flex flex-col gap-1.5"><label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblHost') }}</label><input v-model="addForm.host" :placeholder="t('phHost')" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors caret-accent"></div>
          <div class="flex flex-col gap-1.5"><label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblPort') }}</label><input v-model="addForm.port" inputmode="numeric" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors caret-accent"></div>
          <div class="flex flex-col gap-1.5"><label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblUser') }}</label><input v-model="addForm.user" :placeholder="t('phUser')" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors caret-accent"></div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblProto') }}</label>
            <div class="flex bg-surface2 border border-line rounded-md p-0.5 gap-0.5">
              <button class="seg-btn flex-1 h-7 rounded-[6px] text-xs text-muted transition-all" :class="{ active: addProto === 'SSH' }" @click="addProto = 'SSH'">SSH</button>
              <button class="seg-btn flex-1 h-7 rounded-[6px] text-xs text-muted transition-all" :class="{ active: addProto === 'SFTP' }" @click="addProto = 'SFTP'">SFTP</button>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblGroup') }}</label>
            <select v-model="addForm.group" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors">
              <option v-for="g in addGroupOptions" :key="g" :value="g">{{ tGroup(g) }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5 col-span-2">
            <label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblAuth') }}</label>
            <div class="flex bg-surface2 border border-line rounded-md p-0.5 gap-0.5">
              <button class="seg-btn flex-1 h-7 rounded-[6px] text-xs text-muted transition-all" :class="{ active: addAuth === '密碼' }" @click="addAuth = '密碼'">{{ t('authPwd') }}</button>
              <button class="seg-btn flex-1 h-7 rounded-[6px] text-xs text-muted transition-all" :class="{ active: addAuth === '金鑰檔案' }" @click="addAuth = '金鑰檔案'">{{ t('authKey') }}</button>
            </div>
          </div>
          <div class="flex flex-col gap-1.5 col-span-2"><label class="text-[11px] tracking-[0.04em] text-muted">{{ t('lblSecret') }}</label><input v-model="addForm.pass" type="password" :placeholder="t('phSecret')" class="h-[34px] rounded-md bg-surface2 border border-line text-fg px-2.5 text-[12.5px] outline-0 focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--ring)] transition-colors caret-accent"></div>
        </div>
        <div class="flex justify-end gap-2.5">
          <button class="h-8 px-3.5 rounded-md text-[12.5px] text-muted hover:bg-surface2 hover:text-fg transition-colors" @click="showAddModal = false">{{ t('cancel') }}</button>
          <button class="h-8 px-4 rounded-md bg-accent text-accent-ink font-medium text-[12.5px] hover:brightness-105 transition-[filter]" @click="submitAdd">{{ t('saveConnect') }}</button>
        </div>
      </div>
    </div>

    <!-- editor modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-scrim backdrop-blur-[3px]" @click.self="closeEditor">
      <div class="modal w-[680px] max-w-[92vw] flex flex-col gap-3 bg-surface border border-line rounded-lg p-5 shadow-[0_30px_80px_-20px_var(--shadow-color)]">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-[15px] font-semibold tracking-[-0.01em]">{{ editingTitle }}</h3>
            <div class="font-mono text-[11.5px] text-muted mt-[3px] truncate max-w-[520px]">{{ editingPath }}</div>
          </div>
          <span class="font-mono text-[11px] text-muted border border-line px-2 py-[3px] rounded-[6px] shrink-0">{{ editingPerm }}</span>
        </div>
        <textarea v-model="editorContent" spellcheck="false" class="w-full bg-term text-fg border border-line rounded-md p-3 font-mono text-[12.5px] leading-[1.6] outline-0 caret-accent focus:border-accent-dim transition-colors"></textarea>
        <div class="flex items-center justify-between gap-3">
          <span class="text-[11px] text-muted tabular-nums">{{ editorMeta }}</span>
          <div class="flex justify-end gap-2.5">
            <button class="h-8 px-3.5 rounded-md text-[12.5px] text-muted hover:bg-surface2 hover:text-fg transition-colors" @click="closeEditor">{{ t('cancel') }}</button>
            <button class="h-8 px-4 rounded-md bg-accent text-accent-ink font-medium text-[12.5px] hover:brightness-105 transition-[filter]" @click="saveEditor">{{ t('save') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
