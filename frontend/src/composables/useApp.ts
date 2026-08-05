import { ref, reactive, computed } from 'vue'

const GROUPS_DEFAULT = ['常用伺服器', '生產環境', '開發環境', '客戶端', '個人伺服器']
const GROUPS_KEY = 'ssh-wb-groups-demo'
const LANG_KEY = 'ssh-wb-lang-demo'
const THEME_KEY = 'ssh-wb-theme-demo'
const LANG_DEFAULT = 'en'
const THEMES = ['midnight', 'ember', 'paper', 'sand']

function loadJSON(key: string, fallback: string[]): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) || ''); return Array.isArray(v) ? (v as string[]) : fallback; } catch { return fallback; }
}
function loadStr(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function save(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }

/* ================= types ================= */
interface Server {
  id: string; name: string; group: string; ip: string; port: number; proto: string; user: string;
  os: string; kernel: string; ver: string; status: string; lat: number | null; fav: boolean;
  cpu: number; mem: number; disk: number; uptime: string; load: string; lastLogin: string; srcIp: string;
  rx: number; tx: number; enc: string; fp: string; fs: string;
}
interface Line { t: string; h: string }
export interface FsNode { k: 'd' | 'f'; pm: string; md: string; c?: Record<string, FsNode>; sz?: number; ct?: string | null }
interface Proc { name: string; pid: number; user: string; cpu: number; mem: number; gpu: number; exe: string; pm: string }
type TabKind = 'term' | 'files' | 'proc'
interface Tab {
  kind: TabKind
  serverId: string
  lines: Line[]
  fs: FsNode
  fpath: string
  fsort: { key: string; asc: boolean }
  newItem: { kind: 'file' | 'dir'; rename?: string; ent?: FsNode; value: string } | null
  procs: Proc[]
  psort: { key: string; asc: boolean }
  psearch: string
}
interface CtxItem { icon?: string; label?: string; sep?: boolean; danger?: boolean; fn?: () => void }
interface LiveInfo { rx: number; tx: number; cpu: number; spark: number[] }
interface SidebarGroup { name: string; items: Server[]; editing?: boolean; label?: string; count?: number }

/* ================= i18n ================= */
const I18N: Record<string, Record<string, string>> = {
  'zh-TW': {
    minMin: 'SSH Workbench — 已最小化', restore: '還原視窗',
    closeTitle: '中斷連線並關閉視窗？', closeBody: '所有開啟的分頁與連線都會被中斷。你可以隨時重新連線。',
    cancel: '取消', closeConfirm: '關閉視窗',
    addTitle: '新增伺服器', addBody: '填寫連線資訊，儲存後會立即建立連線。',
    lblName: '名稱', lblHost: '主機位址', lblPort: '通訊埠', lblUser: '使用者', lblProto: '通訊協定', lblGroup: '伺服器群組', lblAuth: '驗證方式', lblSecret: '密碼 / 金鑰密碼',
    phName: '例如 prod-web-02', phHost: 'IP 或主機名稱', phUser: 'root', phSecret: '••••••••',
    authPwd: '密碼', authKey: '金鑰檔案', saveConnect: '儲存並連線', save: '儲存',
    gFav: '常用伺服器', gProd: '生產環境', gDev: '開發環境', gClient: '客戶端', gHome: '個人伺服器',
    emptyTitle: '目前沒有開啟的連線', emptyAdd: '新增連線', emptyDemo: '連線至示範伺服器', emptyHint: '用左側「新增伺服器」建立主機，或直接連線到示範主機',
    sbNewTab: '新增分頁', sbReconnect: '重新連線',
    discTitle: '連線已中斷', discPre: '主機', discPost: '的 SSH 工作階段已關閉', reconnect: '重新連線',
    searchPh: '搜尋伺服器與群組', addServer: '新增伺服器',
    toolFiles: 'SFTP 檔案總管', toolProc: '進程管理', langTitle: '切換語言：繁體中文 / English',
    thLabel: '佈景主題', thDark: '深色', thLight: '淺色', thMidnight: '午夜', thEmber: '餘燼', thPaper: '紙白', thSand: '沙金', atlTheme: '切換佈景主題',
    noResults: '找不到相符的伺服器', emptyDir: '此資料夾是空的', noProcs: '沒有符合條件的程序', termInput: '指令輸入',
    ctxNewGroup: '新增資料夾', ctxRenameGroup: '重新命名資料夾', ctxDeleteGroup: '刪除資料夾',
    phNewGroup: '資料夾名稱', tGroupCreated: '資料夾 {n} 已建立', tGroupRenamed: '資料夾已重新命名為 {n}', tGroupDeleted: '已刪除資料夾 {n}', tNameExists: '名稱已存在', groupMoved: '伺服器已移至「常用伺服器」',
    atlClose: '關閉', atlMin: '最小化', atlPanel: '切換資訊欄', atlSettings: '設定', atlAdd: '新增伺服器',
    stConnected: '已連線', stOffline: '未連線', offlineTag: '離線',
    tConnected: '已連線至 {n}', tFilesOpened: '已開啟 {n} 的檔案總管', tProcOpened: '已開啟 {n} 的進程管理',
    tOfflineNo: '{n} 目前離線，無法連線', tRefreshed: '已重新整理 {n}', tDeleted: '已刪除 {n}',
    tDownloading: '已開始下載 {n}', tRenamed: '已重新命名為 {n}',
    tCreatedDir: '資料夾 {n} 已建立', tCreatedFile: '檔案 {n} 已建立',
    tTerminated: '已終止 {n}（PID {p}）', tRefreshProcs: '已重新整理 {n} 的進程',
    tSaved: '已儲存 {n}', tReconnecting: '正在重新連線至 {n}…', tReconnected: '已重新連線至 {n}',
    tSettings: '設定面板（原型佔位）', tConnectFirst: '請先連線到一個伺服器', tNoDemo: '沒有可連線的示範主機',
    tFillRequired: '請填寫名稱、主機位址與使用者', tCreatedConn: '已建立並連線至 {n}', tRestored: '已重新建立 SSH 連線',
    tQuickTunnel: '使用 {n} 的快速 SSH 隧道…',
    termLastLogin: '最後登入：{a} 來自 {b}', termSftpEst: '[SFTP] 已建立安全檔案傳輸工作階段',
    termHelp: '可用指令：ls · cd · uptime · ping <host> · free · clear · help · exit',
    termHelpSftp: 'SFTP 模式：連線類型為 SFTP 的伺服器可在右側開啟檔案總管。',
    kindSuffixFiles: ' · 檔案', kindSuffixProc: ' · 進程',
    fhName: '名稱', fhSize: '大小', fhMod: '修改時間', fhPerm: '權限',
    fRefresh: '重新整理', fNewFile: '新增檔案', fNewDir: '新增資料夾', fUp: '上一層',
    phDir: '資料夾名稱', phFile: '檔案名稱',
    fsStatus: '{a} 個項目 · {b} · 已用 {c}%',
    ctxNewFile: '新增檔案', ctxNewDir: '新增資料夾', ctxRefresh: '重新整理',
    ctxOpen: '開啟', ctxEdit: '開啟編輯', ctxDownload: '下載', ctxRename: '重新命名', ctxDelete: '刪除',
    ptTitle: '進程管理', ptSearch: '搜尋名稱或 PID', ptKill: '結束',
    pcName: '名稱', pcUser: '使用者', pcMem: '記憶體 %', pcGpu: 'GPU %', pcExe: '檔案位置', pcPm: '權限',
    insEmpty: '選擇一個伺服器以查看詳情',
    insLoad: '系統負載', insUptime: '{n} 運行', insCpu: 'CPU 使用率', insMem: '記憶體', insDisk: '磁碟',
    insNet: '即時網路流量', insRx: '下載 RX', insTx: '上傳 TX',
    insConn: '連線資訊', insHost: '主機', insUser: '使用者', insPort: '通訊埠', insProto: '通訊協定', insEnc: '加密演算法', insFp: '主機金鑰', insFs: '檔案系統',
    insReconnect: '重新連線', insSftp: 'SFTP 總管', insProc: '進程', offline: '已離線',
    appTitle: 'SSH Workbench — 現代化 SSH/SFTP 客戶端', editMeta0: '1 行 · UTF-8',
    editMeta: '{n} 行 · UTF-8 · {s}', editSaved: '{n} 行 · UTF-8 · 已儲存',
    ctLogPreview: '（此為日誌檔，僅顯示預覽）', ctSampleNote: '# 原型範例檔案，可直接在此編輯。'
  },
  'en': {
    minMin: 'SSH Workbench — minimized', restore: 'Restore',
    closeTitle: 'Disconnect & close window?', closeBody: 'All open tabs and connections will be dropped. You can reconnect at any time.',
    cancel: 'Cancel', closeConfirm: 'Close Window',
    addTitle: 'Add Server', addBody: 'Enter connection details — saving connects immediately.',
    lblName: 'Name', lblHost: 'Host Address', lblPort: 'Port', lblUser: 'Username', lblProto: 'Protocol', lblGroup: 'Server Group', lblAuth: 'Auth Method', lblSecret: 'Password / Key Passphrase',
    phName: 'e.g. prod-web-02', phHost: 'IP or hostname', phUser: 'root', phSecret: '••••••••',
    authPwd: 'Password', authKey: 'Key File', saveConnect: 'Save & Connect', save: 'Save',
    gFav: 'Favorites', gProd: 'Production', gDev: 'Development', gClient: 'Clients', gHome: 'Personal',
    emptyTitle: 'No active connections', emptyAdd: 'New Connection', emptyDemo: 'Connect to a demo server', emptyHint: 'Create a host from Add Server in the sidebar, or connect straight to a demo host.',
    sbNewTab: 'New Tab', sbReconnect: 'Reconnect',
    discTitle: 'Connection Lost', discPre: 'Host', discPost: 'SSH session closed', reconnect: 'Reconnect',
    searchPh: 'Search servers and groups', addServer: 'Add Server',
    toolFiles: 'SFTP File Manager', toolProc: 'Process Manager', langTitle: 'Switch language: 繁體中文 / English',
    thLabel: 'Theme', thDark: 'Dark', thLight: 'Light', thMidnight: 'Midnight', thEmber: 'Ember', thPaper: 'Paper', thSand: 'Sand', atlTheme: 'Switch theme',
    noResults: 'No matching servers', emptyDir: 'This folder is empty', noProcs: 'No matching processes', termInput: 'Command input',
    ctxNewGroup: 'New Folder', ctxRenameGroup: 'Rename Folder', ctxDeleteGroup: 'Delete Folder',
    phNewGroup: 'Folder name', tGroupCreated: 'Folder {n} created', tGroupRenamed: 'Folder renamed to {n}', tGroupDeleted: 'Deleted folder {n}', tNameExists: 'Name already exists', groupMoved: 'Servers moved to Favorites',
    atlClose: 'Close', atlMin: 'Minimize', atlPanel: 'Toggle inspector', atlSettings: 'Settings', atlAdd: 'Add Server',
    stConnected: 'Connected', stOffline: 'Not connected', offlineTag: 'Offline',
    tConnected: 'Connected to {n}', tFilesOpened: 'File manager opened for {n}', tProcOpened: 'Process manager opened for {n}',
    tOfflineNo: '{n} is offline — cannot connect', tRefreshed: 'Refreshed {n}', tDeleted: 'Deleted {n}',
    tDownloading: 'Downloading {n}…', tRenamed: 'Renamed to {n}',
    tCreatedDir: 'Folder {n} created', tCreatedFile: 'File {n} created',
    tTerminated: 'Terminated {n} (PID {p})', tRefreshProcs: 'Refreshed processes on {n}',
    tSaved: 'Saved {n}', tReconnecting: 'Reconnecting to {n}…', tReconnected: 'Reconnected to {n}',
    tSettings: 'Settings panel (prototype)', tConnectFirst: 'Connect to a server first', tNoDemo: 'No demo host available',
    tFillRequired: 'Please fill in name, host and username', tCreatedConn: 'Created and connected to {n}', tRestored: 'SSH connection re-established',
    tQuickTunnel: 'Opening quick SSH tunnel to {n}…',
    termLastLogin: 'Last login: {a} from {b}', termSftpEst: '[SFTP] Secure file-transfer session established',
    termHelp: 'Commands: ls · cd · uptime · ping <host> · free · clear · help · exit',
    termHelpSftp: 'SFTP: servers connected via SFTP can open the file manager from the inspector.',
    kindSuffixFiles: ' · Files', kindSuffixProc: ' · Processes',
    fhName: 'Name', fhSize: 'Size', fhMod: 'Modified', fhPerm: 'Permissions',
    fRefresh: 'Refresh', fNewFile: 'New File', fNewDir: 'New Folder', fUp: 'Up one level',
    phDir: 'Folder name', phFile: 'File name',
    fsStatus: '{a} items · {b} · {c}% used',
    ctxNewFile: 'New File', ctxNewDir: 'New Folder', ctxRefresh: 'Refresh',
    ctxOpen: 'Open', ctxEdit: 'Edit', ctxDownload: 'Download', ctxRename: 'Rename', ctxDelete: 'Delete',
    ptTitle: 'Process Manager', ptSearch: 'Search name or PID', ptKill: 'Kill',
    pcName: 'Name', pcUser: 'User', pcMem: 'Mem %', pcGpu: 'GPU %', pcExe: 'File location', pcPm: 'Permissions',
    insEmpty: 'Select a server to view details',
    insLoad: 'System Load', insUptime: 'up {n}', insCpu: 'CPU Usage', insMem: 'Memory', insDisk: 'Disk',
    insNet: 'Live Traffic', insRx: 'Download RX', insTx: 'Upload TX',
    insConn: 'Connection', insHost: 'Host', insUser: 'User', insPort: 'Port', insProto: 'Protocol', insEnc: 'Encryption', insFp: 'Host Key', insFs: 'Filesystem',
    insReconnect: 'Reconnect', insSftp: 'SFTP Manager', insProc: 'Processes', offline: 'Offline',
    appTitle: 'SSH Workbench — Modern SSH/SFTP Client', editMeta0: '1 line · UTF-8',
    editMeta: '{n} lines · UTF-8 · {s}', editSaved: '{n} lines · UTF-8 · Saved',
    ctLogPreview: '(Log preview only)', ctSampleNote: '# Prototype sample file — edit me.'
  }
}

/* ================= icons (context menu) ================= */
export const ICONS: Record<string, string> = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  folderPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>',
  folderOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'
}

/* ================= data ================= */
const SERVERS: Server[] = [
  { id:'prod-app-01', name:'prod-app-01', group:'常用伺服器', ip:'203.0.113.24', port:22, proto:'SSH', user:'deploy', os:'Ubuntu 22.04', kernel:'6.5.0-45-generic', ver:'22.04.4 LTS', status:'online', lat:38, fav:true,
    cpu:34, mem:62, disk:71, uptime:'42 days', load:'0.41, 0.38, 0.35', lastLogin:'2026-08-03 09:12:44', srcIp:'61.216.32.10', rx:1.24, tx:0.186, enc:'aes256-gcm@openssh.com', fp:'SHA256:oL9f…7xKq', fs:'ext4 / 58GB' },
  { id:'prod-db-01', name:'prod-db-01', group:'生產環境', ip:'203.0.113.31', port:22, proto:'SSH', user:'ubuntu', os:'Ubuntu 22.04', kernel:'6.5.0-45-generic', ver:'22.04.4 LTS', status:'online', lat:45, fav:false,
    cpu:71, mem:84, disk:42, uptime:'120 days', load:'2.18, 2.02, 1.94', lastLogin:'2026-08-03 08:03:11', srcIp:'10.0.12.1', rx:3.85, tx:1.02, enc:'aes256-gcm@openssh.com', fp:'SHA256:mQ2p…9RwC', fs:'ext4 / 120GB' },
  { id:'dev-staging', name:'dev-staging', group:'開發環境', ip:'10.0.12.8', port:22, proto:'SSH', user:'dev', os:'Debian 12', kernel:'6.1.0-18-amd64', ver:'12 (bookworm)', status:'online', lat:12, fav:false,
    cpu:12, mem:38, disk:55, uptime:'6 days', load:'0.18, 0.21, 0.19', lastLogin:'2026-08-03 09:02:55', srcIp:'10.0.12.1', rx:0.42, tx:0.09, enc:'chacha20-poly1305@openssh.com', fp:'SHA256:h3nA…k9Pe', fs:'ext4 / 80GB' },
  { id:'dev-local-vm', name:'dev-local-vm', group:'開發環境', ip:'192.168.1.24', port:22, proto:'SSH', user:'neverwin', os:'macOS 14.5', kernel:'Darwin 23.5.0', ver:'14.5', status:'online', lat:4, fav:true,
    cpu:8, mem:44, disk:63, uptime:'3 days', load:'0.62, 0.58, 0.55', lastLogin:'2026-08-03 09:14:02', srcIp:'192.168.1.10', rx:0.18, tx:0.03, enc:'aes256-gcm@openssh.com', fp:'SHA256:lW4m…3BxF', fs:'apfs / 1TB' },
  { id:'client-work-a', name:'工作站-A', group:'客戶端', ip:'172.16.0.9', port:2222, proto:'SFTP', user:'client', os:'CentOS 7', kernel:'3.10.0-1160', ver:'7.9.2009', status:'online', lat:88, fav:true,
    cpu:26, mem:51, disk:77, uptime:'9 days', load:'0.33, 0.40, 0.36', lastLogin:'2026-08-03 07:41:20', srcIp:'172.16.0.1', rx:0.66, tx:0.21, enc:'aes256-ctr', fp:'SHA256:v8Nd…5HzQ', fs:'xfs / 200GB' },
  { id:'home-nas', name:'home-nas', group:'個人伺服器', ip:'192.168.1.5', port:22, proto:'SFTP', user:'nas', os:'openmediavault 6', kernel:'6.1.0', ver:'6', status:'offline', lat:null, fav:false,
    cpu:0, mem:0, disk:81, uptime:'—', load:'—', lastLogin:'2026-08-02 22:15:47', srcIp:'192.168.1.10', rx:0, tx:0, enc:'aes128-gcm@openssh.com', fp:'SHA256:Q5fK…2aMn', fs:'ext4 / 4TB' }
]

/* ================= module-singleton state ================= */
const servers = ref<Server[]>(SERVERS)
const groups = ref<string[]>(loadJSON(GROUPS_KEY, GROUPS_DEFAULT.slice()))

const lang = ref<string>(loadStr(LANG_KEY, LANG_DEFAULT))
const theme = ref<string>(loadStr(THEME_KEY, 'midnight'))

const search = ref('')
const collapsed = ref<Set<string>>(new Set())
const groupEdit = ref<{ mode: 'new' } | { mode: 'rename'; name: string } | null>(null)
const groupInput = ref('')

const tabs = ref<Tab[]>([])
const activeTab = ref(-1)
const panelOpen = ref(window.innerWidth > 980)
const isWide = ref(window.innerWidth > 980)
const minimized = ref(false)
const disconnected = ref(false)

const showCloseModal = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)

const addForm = reactive({ name:'', host:'', port:'22', user:'root', pass:'', group:'常用伺服器' })
const addProto = ref<string>('SSH')
const addAuth = ref<string>('密碼')

const editing = reactive<{ tab: Tab | null; path: string; ent: FsNode | null }>({ tab: null, path: '', ent: null })
const editorContent = ref('')

const ctxMenu = reactive<{ show: boolean; x: number; y: number; items: CtxItem[] }>({ show: false, x: 0, y: 0, items: [] })
const themePopOpen = ref(false)

const toasts = ref<Array<{ id: number; msg: string }>>([])
let toastSeq = 0

const termInput = ref('')
const clock = ref('')
const live = ref<Record<string, LiveInfo>>({})

/* ================= helpers ================= */
const serverById = (id: string): Server | undefined => servers.value.find(s => s.id === id)

function t(key: string, args?: Record<string, string | number>): string {
  let s = (I18N[lang.value] && I18N[lang.value][key]) || I18N['en'][key] || key
  if (args) for (const a in args) s = s.split('{' + a + '}').join(String(args[a]))
  return s
}
const GRP_KEY: Record<string, string> = { '常用伺服器':'gFav', '生產環境':'gProd', '開發環境':'gDev', '客戶端':'gClient', '個人伺服器':'gHome' }
const tGroup = (g: string): string => GRP_KEY[g] ? t(GRP_KEY[g]) : g
const themeI18nKey = (id: string): string => 'th' + id[0].toUpperCase() + id.slice(1)

const fmtRate = (mb: number): string => mb >= 1 ? mb.toFixed(2) + ' MB/s' : Math.round(mb * 1000) + ' KB/s'
const fmtSize = (n: number): string => n >= 1e9 ? (n / 1e9).toFixed(2) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(2) + ' MB' : n >= 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B'

function saveGroups() { save(GROUPS_KEY, JSON.stringify(groups.value)) }
function saveLang() { save(LANG_KEY, lang.value) }

/* ================= toasts ================= */
function toast(msg: string) {
  const id = ++toastSeq
  toasts.value.push({ id, msg })
  setTimeout(() => {
    const i = toasts.value.findIndex(x => x.id === id)
    if (i >= 0) toasts.value.splice(i, 1)
  }, 2200)
}

/* ================= context menu ================= */
function openCtx(x: number, y: number, items: CtxItem[]) {
  const w = 178
  ctxMenu.items = items
  ctxMenu.x = Math.max(8, Math.min(x, window.innerWidth - w - 8))
  ctxMenu.y = Math.max(8, Math.min(y, window.innerHeight - items.length * 34 - 16))
  ctxMenu.show = true
}
function closeCtx() { ctxMenu.show = false; ctxMenu.items = [] }
function runCtxItem(item: CtxItem) { if (item && item.fn) item.fn(); closeCtx() }

/* ================= theme ================= */
function applyTheme() {
  document.documentElement.dataset.theme = theme.value
  save(THEME_KEY, theme.value)
}
function setTheme(id: string) { theme.value = id; themePopOpen.value = false; applyTheme() }

/* ================= lang ================= */
function toggleLang() {
  lang.value = lang.value === 'en' ? 'zh-TW' : 'en'
  saveLang()
}

/* ================= sidebar ================= */
function toggleGroup(name: string) {
  const set = collapsed.value
  set.has(name) ? set.delete(name) : set.add(name)
  collapsed.value = new Set(set)
}
function isCollapsed(name: string) { return collapsed.value.has(name) }

const sidebarGroups = computed<SidebarGroup[]>(() => {
  const f = search.value.trim().toLowerCase()
  const list: SidebarGroup[] = []
  for (const g of groups.value) {
    const items = servers.value.filter(s =>
      s.group === g && (!f || s.name.toLowerCase().includes(f) || s.ip.includes(f)))
    if (!items.length && GROUPS_DEFAULT.includes(g)) continue
    if (groupEdit.value && groupEdit.value.mode === 'rename' && groupEdit.value.name === g) {
      list.push({ name: g, items, editing: true })
      continue
    }
    list.push({ name: g, label: tGroup(g), items, count: items.length })
  }
  return list
})

function startNewGroup() { groupEdit.value = { mode: 'new' }; groupInput.value = ''; search.value = '' }
function startRenameGroup(name: string) { groupEdit.value = { mode: 'rename', name }; groupInput.value = '' }
function commitGroupEdit() {
  const v = groupInput.value.trim()
  const mode = groupEdit.value && groupEdit.value.mode
  const existing = groupEdit.value && groupEdit.value.mode === 'rename' ? groupEdit.value.name : null
  if (!v) { groupEdit.value = null; return }
  if ((mode === 'rename' ? v !== existing : true) && groups.value.includes(v)) { toast(t('tNameExists')); return }
  if (mode === 'rename') {
    const i = groups.value.indexOf(existing as string)
    if (i >= 0) groups.value[i] = v
    servers.value.forEach(s => { if (s.group === existing) s.group = v })
    toast(t('tGroupRenamed', { n: v }))
  } else {
    groups.value.push(v)
    toast(t('tGroupCreated', { n: v }))
  }
  saveGroups()
  groupEdit.value = null
}
function cancelGroupEdit() { groupEdit.value = null }
function deleteGroup(name: string) {
  groups.value = groups.value.filter(g => g !== name)
  servers.value.forEach(s => { if (s.group === name) s.group = '常用伺服器' })
  saveGroups()
}
function deleteGroupAction(name: string) {
  const n = servers.value.filter(s => s.group === name).length
  deleteGroup(name)
  toast(n ? `${t('tGroupDeleted', { n: name })} · ${t('groupMoved')}` : t('tGroupDeleted', { n: name }))
}

/* ================= tabs ================= */
const activeTabObj = computed<Tab | undefined>(() => (activeTab.value >= 0 ? tabs.value[activeTab.value] : undefined))
const activeConnection = computed<Server | undefined | null>(() => activeTabObj.value ? serverById(activeTabObj.value.serverId) : null)
const hasConnection = computed(() => tabs.value.length > 0 && activeTab.value >= 0)
const activeKind = computed<TabKind | null>(() => activeTabObj.value ? activeTabObj.value.kind : null)

function activateTab(i: number) { activeTab.value = i }
function openTab(serverId: string, kind?: TabKind) {
  const k: TabKind = kind || 'term'
  const found = tabs.value.findIndex(t => t.serverId === serverId && t.kind === k)
  if (found >= 0) { activateTab(found); return }
  const s = serverById(serverId)
  if (!s) return
  const tab: Tab = {
    kind: k, serverId, lines: [],
    fs: fsOf(s), fpath: '/', fsort: { key: 'name', asc: true }, newItem: null,
    procs: procsOf(s), psort: { key: 'cpu', asc: false }, psearch: '',
  }
  if (k === 'term') tab.lines = makeSession(s)
  if (k === 'files') tab.fpath = '/home/' + s.user
  tabs.value.push(tab)
  activateTab(tabs.value.length - 1)
  toast(k === 'term' ? t('tConnected', { n: serverId }) : (k === 'files' ? t('tFilesOpened', { n: serverId }) : t('tProcOpened', { n: serverId })))
}
function openServer(id: string) {
  const s = serverById(id)
  if (!s || s.status === 'offline') { if (s) toast(t('tOfflineNo', { n: s.name })); return }
  openTab(id, 'term')
}
function closeTab(i: number) {
  tabs.value.splice(i, 1)
  if (!tabs.value.length) activeTab.value = -1
  else if (i <= activeTab.value) activeTab.value = Math.max(0, i - 1)
}
function newTab() {
  const first = servers.value.find(s => !tabs.value.some(t => t.serverId === s.id) && s.status === 'online')
  if (first) openTab(first.id)
  else showAddModal.value = true
}
const openFiles = (id: string) => openTab(id, 'files')
const openProc = (id: string) => openTab(id, 'proc')

function makeSession(server: Server): Line[] {
  const lines: Line[] = [
    { t:'sys', h:t('termLastLogin', { a: server.lastLogin, b: server.srcIp }) },
    { t:'sys', h:`${server.os} (GNU/Linux ${server.kernel} x86_64)` },
    { t:'cmd', h:'cat /etc/os-release' },
    { t:'out', h:`PRETTY_NAME="${server.os} ${server.ver}"` },
    { t:'cmd', h:'uptime' },
    { t:'out', h:` 09:15:31 up ${server.uptime},  1 user,  load average: ${server.load}` }
  ]
  if (server.proto === 'SFTP') lines.push({ t:'sys', h:t('termSftpEst') })
  return lines
}

/* ================= terminal ================= */
const activeTermTab = computed<Tab | undefined>(() => activeKind.value === 'term' ? activeTabObj.value : undefined)
const activeTermServer = computed<Server | null>(() => activeTermTab.value ? (serverById(activeTermTab.value.serverId) ?? null) : null)

function helpText() { return [t('termHelp'), t('termHelpSftp')] }
function runCommand() {
  const tab = activeTermTab.value
  if (!tab) return
  const s = activeTermServer.value
  if (!s) return
  const raw = termInput.value
  termInput.value = ''
  const cmd = raw.trim()
  tab.lines.push({ t:'cmd', h:cmd })
  const c = cmd.split(/\s+/)[0]
  if (!cmd) { /* no-op */ }
  else if (c === 'clear') tab.lines = []
  else if (c === 'help') helpText().forEach(h => tab.lines.push({ t:'out', h }))
  else if (c === 'ls') tab.lines.push({ t:'out', h:'app/   config/   deploy.sh   logs/   node_modules/   package.json   README.md' })
  else if (c === 'uptime') tab.lines.push({ t:'out', h:` 09:15:31 up ${s.uptime},  1 user,  load average: ${s.load}` })
  else if (c === 'ping') {
    const host = cmd.split(/\s+/)[1] || 'example.com'
    ;[1,2,3].forEach((n, i) => tab.lines.push({ t:'out', h:`64 bytes from ${host} (93.184.216.34): icmp_seq=${n} ttl=56 time=${((s.lat ?? 0) + i * 2 + 1)} ms` }))
    tab.lines.push({ t:'sys', h:`--- ${host} ping statistics --- 3 packets transmitted, 0% packet loss` })
  }
  else if (c === 'free') tab.lines.push({ t:'out', h:'              total        used        free      shared  buff/cache\nMem:         15.6G        6.2G        4.8G       218M        4.6G\nSwap:         2.0G        0.0B        2.0G' })
  else if (c === 'exit') { closeTab(activeTab.value); return }
  else if (c === 'ssh') { const host = cmd.split(/\s+/)[1]; tab.lines.push({ t:'sys', h:t('tQuickTunnel', { n: host || 'remote' }) }) }
  else tab.lines.push({ t:'err', h:`bash: ${c}: command not found` })
}

/* ================= SFTP file manager ================= */
const D = (c: Record<string, FsNode> = {}, pm = 'drwxr-xr-x', md = '2026-07-28 04:12'): FsNode => ({ k: 'd', pm, md, c })
const F = (sz: number, md = '2026-07-30 09:15', pm = '-rw-r--r--', ct: string | null = null): FsNode => ({ k: 'f', sz, md, pm, ct })
function fsOf(s: Server): FsNode {
  const u = s.user
  return D({
    home: D({
      [u]: D({
        app: D({
          'package.json': F(5200, '2026-08-02 21:18', '-rw-r--r--', '{\n  "name": "my-app",\n  "version": "1.4.2",\n  "scripts": { "start": "node server.js" }\n}\n'),
          'server.js': F(2400, '2026-08-02 21:20', '-rw-r--r--', 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.end("hello from ' + s.name + '");\n});\n\nserver.listen(3000);\n'),
          'deploy.sh': F(1800, '2026-08-02 21:21', '-rwxr-xr-x', '#!/usr/bin/env bash\n\nnpm ci && pm2 restart all\necho "deploy done"\n'),
          '.env': F(320, '2026-08-02 21:16', '-rw-------', 'NODE_ENV=production\nPORT=3000\n')
        }),
        logs: D({
          'access.log': F(12400000, '2026-08-03 09:14', '-rw-r--r--'),
          'error.log': F(1200000, '2026-08-03 08:52', '-rw-r--r--', '[2026-08-03 08:52:11] error: EADDRINUSE: address already in use :3000\n')
        }),
        '.ssh': D({ 'authorized_keys': F(420, '2026-07-25 19:02', '-rw-------') }),
        ...(s.proto === 'SFTP' ? { docs: D({
          '報告-08月.docx': F(128400, '2026-08-01 10:22'),
          '合約.pdf': F(842300, '2026-07-28 15:40'),
          '備份.zip': F(18200000, '2026-07-30 09:12'),
          '圖片': D({ 'banner.png': F(2100000, '2026-07-29 11:05'), 'logo.svg': F(8800, '2026-07-27 08:19') })
        }) } : {})
      })
    }),
    etc: D({
      'hostname': F(14, '2026-07-28 04:12'),
      'ssh': D({ 'sshd_config': F(3400, '2026-07-28 04:13', '-rw-r--r--', 'Port 22\nPermitRootLogin no\nPasswordAuthentication yes\n') }),
      ...(s.id.includes('db') ? { postgresql: D({ 'postgresql.conf': F(28000, '2026-07-28 04:14') }) } : { nginx: D({ 'sites-enabled': D({ 'default': F(1800, '2026-07-28 04:15') }) }) })
    }),
    var: D({
      log: D({ 'syslog': F(3100000, '2026-08-03 09:10') }),
      ...(s.id.includes('db') ? { lib: D({ postgresql: D({ '16': D({ 'main': D({}) }) }) }) } : { www: D({ 'html': D({ 'index.html': F(910, '2026-07-29 12:00', '-rw-r--r--', '<h1>Welcome</h1>\n') }) }) })
    }),
    opt: D({ node: D({ 'bin': D({ 'node': F(65000000, '2026-06-11 10:00', '-rwxr-xr-x') }) }) }),
    tmp: D({})
  })
}
function resolve(root: FsNode | undefined, path: string): FsNode | null {
  if (!root) return null
  let n: FsNode | undefined = root
  for (const seg of path.split('/').filter(Boolean)) {
    if (!n || !n.c || !n.c[seg]) return null
    n = n.c[seg]
  }
  return n || null
}
const joinPath = (a: string, b: string): string => (a === '/' ? '' : a) + '/' + b

const activeFilesTab = computed<Tab | undefined>(() => activeKind.value === 'files' ? activeTabObj.value : undefined)
const filesServer = computed<Server | null>(() => activeFilesTab.value ? (serverById(activeFilesTab.value.serverId) ?? null) : null)
const filesNode = computed<FsNode | null>(() => {
  const tab = activeFilesTab.value
  return tab ? (resolve(tab.fs, tab.fpath) || tab.fs) : null
})
const filesEntries = computed<Array<[string, FsNode]>>(() => {
  const tab = activeFilesTab.value
  if (!tab || !filesNode.value) return []
  const node = filesNode.value
  const fs = tab.fsort
  return Object.entries(node.c || {}).sort(([a, av], [b, bv]) => {
    if (av.k !== bv.k) return av.k === 'd' ? -1 : 1
    const d = fs.asc ? 1 : -1
    if (fs.key === 'sz') return (av.sz || 0) - (bv.sz || 0) * d
    if (fs.key === 'md') return (av.md || '').localeCompare(bv.md || '') * d
    return a.localeCompare(b) * d
  })
})
const filesCrumbs = computed<string[]>(() => (activeFilesTab.value ? activeFilesTab.value.fpath.split('/').filter(Boolean) : []))
const filesNewItem = computed(() => (activeFilesTab.value ? activeFilesTab.value.newItem : undefined))

function sortFiles(key: string) {
  const tab = activeFilesTab.value
  if (!tab) return
  if (tab.fsort.key === key) tab.fsort.asc = !tab.fsort.asc
  else tab.fsort = { key, asc: false }
}
function navTo(path: string) { const tab = activeFilesTab.value; if (tab) tab.fpath = path }
function upOne() {
  const tab = activeFilesTab.value
  if (!tab) return
  tab.fpath = tab.fpath === '/' ? '/' : tab.fpath.slice(0, tab.fpath.lastIndexOf('/')) || '/'
}
function refreshFiles() { const tab = activeFilesTab.value; if (tab) toast(t('tRefreshed', { n: tab.fpath })) }
function startNewItem(kind: 'file' | 'dir') { const tab = activeFilesTab.value; if (tab) tab.newItem = { kind, value: '' } }
function startRename(name: string, ent: FsNode) { const tab = activeFilesTab.value; if (tab) tab.newItem = { kind: ent.k === 'd' ? 'dir' : 'file', rename: name, ent, value: name } }
function cancelNewItem() { const tab = activeFilesTab.value; if (tab) tab.newItem = null }
function commitNewItem() {
  const tab = activeFilesTab.value
  if (!tab || !tab.newItem) return
  const item = tab.newItem
  const val = (item.value ?? '').trim()
  if (!val) { tab.newItem = null; return }
  const parent = resolve(tab.fs, tab.fpath)
  if (!parent) return
  if (!parent.c) parent.c = {}
  if (item.rename != null) {
    delete parent.c[item.rename]
    parent.c[val] = item.ent as FsNode
    toast(t('tRenamed', { n: val }))
  } else {
    parent.c[val] = item.kind === 'dir' ? D() : F(0, new Date().toISOString().slice(0, 16).replace('T', ' '))
    toast(t(item.kind === 'dir' ? 'tCreatedDir' : 'tCreatedFile', { n: val }))
  }
  tab.newItem = null
}
function deleteEntry(name: string) {
  const tab = activeFilesTab.value
  if (!tab || !filesNode.value || !filesNode.value.c) return
  delete filesNode.value.c[name]
  toast(t('tDeleted', { n: name }))
}

/* ================= process manager ================= */
function procsOf(s: Server): Proc[] {
  const u = s.user, isDb = s.id.includes('db'), hasGpu = s.id.includes('local') || s.id.includes('staging')
  const procs: Proc[] = [
    { name:'systemd', pid:1, user:'root', cpu:0.1, mem:0.8, gpu:0, exe:'/sbin/init', pm:'rw-r--r--' },
    { name:'systemd-journald', pid:324, user:'root', cpu:0.2, mem:1.1, gpu:0, exe:'/usr/lib/systemd/systemd-journald', pm:'rw-r--r--' },
    { name:'sshd', pid:847, user:'root', cpu:0.0, mem:0.6, gpu:0, exe:'/usr/sbin/sshd', pm:'rw-r--r--' },
    { name:isDb ? 'postgres' : 'nginx', pid:isDb ? 1211 : 1024, user:isDb ? 'postgres' : 'www-data', cpu:isDb ? 8.4 : 1.2, mem:isDb ? 22.7 : 3.1, gpu:0, exe:isDb ? '/usr/lib/postgresql/16/bin/postgres' : 'nginx: master process', pm:'rw-r--r--' },
    { name:'node', pid:2210, user:u, cpu:34.2, mem:12.4, gpu:0, exe:'/opt/node/bin/node /home/' + u + '/app/server.js', pm:'rw-r--r--' },
    { name:'python3', pid:1502, user:u, cpu:2.4, mem:3.6, gpu:0, exe:'/usr/bin/python3 /home/' + u + '/scripts/worker.py', pm:'rw-r--r--' },
    { name:'bash', pid:2312, user:u, cpu:0.0, mem:0.9, gpu:0, exe:'-bash', pm:'rw-r--r--' },
    { name:'sshd: ' + u + '@pts/0', pid:2389, user:u, cpu:0.0, mem:0.4, gpu:0, exe:'sshd: ' + u + '@pts/0', pm:'rw-------' },
    { name:'dbus-daemon', pid:486, user:'messagebus', cpu:0.0, mem:0.3, gpu:0, exe:'/usr/bin/dbus-daemon --system', pm:'rw-r--r--' },
    { name:'cron', pid:612, user:'root', cpu:0.0, mem:0.2, gpu:0, exe:'/usr/sbin/cron -f', pm:'rw-r--r--' }
  ]
  if (hasGpu) procs.push({ name:'ffmpeg', pid:3041, user:u, cpu:12.8, mem:5.9, gpu:18.5, exe:'/usr/bin/ffmpeg -re -i stream.flv', pm:'rw-r--r--' })
  return procs
}
const activeProcTab = computed<Tab | undefined>(() => activeKind.value === 'proc' ? activeTabObj.value : undefined)
const procServer = computed<Server | null>(() => activeProcTab.value ? (serverById(activeProcTab.value.serverId) ?? null) : null)
const procRows = computed<Proc[]>(() => {
  const tab = activeProcTab.value
  if (!tab) return []
  const f = (tab.psearch || '').toLowerCase()
  let rows = tab.procs.filter(p => !f || p.name.toLowerCase().includes(f) || String(p.pid).includes(f))
  const d = tab.psort.asc ? 1 : -1
  rows = [...rows].sort((a, b) => {
    if (tab.psort.key === 'name') return a.name.localeCompare(b.name) * d
    return ((a as unknown as Record<string, number>)[tab.psort.key] - (b as unknown as Record<string, number>)[tab.psort.key]) * d
  })
  return rows
})
function sortProc(key: string) {
  const tab = activeProcTab.value
  if (!tab) return
  if (tab.psort.key === key) tab.psort.asc = !tab.psort.asc
  else tab.psort = { key, asc: false }
}
function refreshProcs() {
  const tab = activeProcTab.value
  const s = procServer.value
  if (!tab || !s) return
  tab.procs = procsOf(s)
  toast(t('tRefreshProcs', { n: s.name }))
}
function killProc(pid: number) {
  const tab = activeProcTab.value
  if (!tab) return
  const p = tab.procs ? tab.procs.find(x => x.pid === pid) : undefined
  if (!p) return
  tab.procs = tab.procs ? tab.procs.filter(x => x.pid !== pid) : []
  toast(t('tTerminated', { n: p.name, p: pid }))
}
const procHeat = (v: number): string => v > 60 ? ' hot2' : v > 25 ? ' hot' : ''

/* ================= inspector ================= */
const inspectorVisible = computed(() => panelOpen.value && hasConnection.value)
const mainGrid = computed(() => (isWide.value && inspectorVisible.value) ? '236px 1fr 276px' : '236px 1fr')

const sparkBars = computed<number[]>(() => {
  const s = activeConnection.value
  if (!s) return []
  const L = live.value[s.id]
  const pts = L ? L.spark : Array.from({ length:20 }, (_, i) => 20 + Math.round(30 * Math.abs(Math.sin(i / 3))))
  return pts.map(p => Math.max(6, Math.min(100, p)))
})
const cpuLive = computed<number>(() => {
  const s = activeConnection.value
  if (!s) return 0
  const L = live.value[s.id]
  return L ? Math.round(L.cpu) : s.cpu
})
const memLive = computed<number>(() => {
  const s = activeConnection.value
  if (!s) return 0
  if (s.status !== 'online') return s.mem
  return Math.round(s.mem + Math.sin(Date.now() / 6000) * 1.5)
})
const netRx = computed<string>(() => {
  const s = activeConnection.value
  if (!s) return '—'
  const L = live.value[s.id]
  return fmtRate(L ? L.rx : s.rx)
})
const netTx = computed<string>(() => {
  const s = activeConnection.value
  if (!s) return '—'
  const L = live.value[s.id]
  return fmtRate(L ? L.tx : s.tx)
})

function reconnectAction() {
  const s = activeConnection.value
  if (!s) return
  toast(t('tReconnecting', { n: s.name }))
  setTimeout(() => toast(t('tReconnected', { n: s.name })), 900)
}

/* ================= editor modal ================= */
function contentFor(ent: FsNode, name: string): string {
  if (ent.ct != null) return ent.ct
  const ext = (name.split('.').pop() ?? '').toLowerCase()
  return ext === 'log' ? `${t('ctLogPreview')}\n[2026-08-03 09:14:02] INFO  health-check ok\n[2026-08-03 09:14:11] INFO  request GET / 200 12ms\n`
    : `# ${name}\n${t('ctSampleNote')}\n`
}
function openEditor(path: string, ent: FsNode) {
  const tab = activeFilesTab.value
  if (!tab) return
  editing.tab = tab
  editing.path = path
  editing.ent = ent
  editorContent.value = contentFor(ent, path)
  showEditModal.value = true
}
const editorMeta = computed<string>(() => {
  const lines = editorContent.value.split('\n').length
  if (!editing.tab) return t('editMeta0')
  return t('editMeta', { n: lines, s: fmtSize(editing.ent ? editing.ent.sz || 0 : 0) })
})
const editingTitle = computed<string>(() => (editing.path ? editing.path.split('/').pop() || '' : ''))
const editingPath = computed<string>(() => (editing.tab && serverById(editing.tab.serverId) ? `${serverById(editing.tab.serverId)!.name} : ${editing.path}` : ''))
const editingPerm = computed<string>(() => (editing.ent ? editing.ent.pm : ''))
function saveEditor() {
  if (!editing.tab) return
  const node = resolve(editing.tab.fs, editing.path)
  if (node) node.ct = editorContent.value
  toast(t('tSaved', { n: editing.path.split('/').pop() || '' }))
  showEditModal.value = false
}
function closeEditor() { showEditModal.value = false }

/* ================= add-server modal ================= */
function openAddModal() {
  addForm.name = ''; addForm.host = ''; addForm.port = '22'; addForm.user = 'root'; addForm.pass = ''
  addForm.group = groups.value.find(g => g !== '常用伺服器') || '常用伺服器'
  addProto.value = 'SSH'
  addAuth.value = '密碼'
  showAddModal.value = true
}
function submitAdd() {
  const name = addForm.name.trim(), host = addForm.host.trim(), user = addForm.user.trim()
  if (!name || !host || !user) { toast(t('tFillRequired')); return }
  const port = parseInt(addForm.port || '22', 10)
  const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') || ('srv-' + Date.now())
  const group = addForm.group
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  servers.value.push({
    id, name, group, ip:host, port, proto:addProto.value, user, os:'Ubuntu 22.04', kernel:'6.5.0-45-generic', ver:'22.04.4 LTS',
    status:'online', lat:Math.round(10 + Math.random() * 70), fav:false, cpu:9, mem:31, disk:38, uptime:'1 min',
    load:'0.12, 0.10, 0.08', lastLogin:now, srcIp:'203.0.113.1', rx:0.02, tx:0.01, enc:'aes256-gcm@openssh.com', fp:'SHA256:••••••••', fs:'ext4 / 40GB'
  })
  showAddModal.value = false
  openTab(id, 'term')
  toast(t('tCreatedConn', { n: name }))
}

/* ================= close / minimize ================= */
function minimize() { minimized.value = true }
function restore() { minimized.value = false }
function demoConnect() {
  const first = servers.value.find(s => s.status === 'online')
  if (first) openTab(first.id)
  else toast(t('tNoDemo'))
}
function togglePanel() { panelOpen.value = !panelOpen.value }
function confirmClose() {
  showCloseModal.value = false
  minimized.value = false
  disconnected.value = false
  tabs.value = []
  activeTab.value = -1
}
const statusConnection = computed(() => {
  const s = activeConnection.value
  const on = !!s && s.status === 'online'
  return { name: s ? s.name : t('stOffline'), on, ping: s && s.lat != null ? s.lat + ' ms' : t('offlineTag') }
})

/* ================= live tick ================= */
function tick() {
  clock.value = new Date().toTimeString().slice(0, 8)
  tabs.value.forEach(tab => {
    const s = serverById(tab.serverId)
    if (!s || s.status !== 'online') return
    if (!live.value[s.id]) live.value[s.id] = { rx:s.rx, tx:s.tx, cpu:s.cpu, spark:[] }
    const L = live.value[s.id]
    L.rx = Math.max(0.01, L.rx + (Math.random() - 0.48) * 0.14)
    L.tx = Math.max(0.01, L.tx + (Math.random() - 0.48) * 0.03)
    L.cpu = Math.max(3, Math.min(96, L.cpu + (Math.random() - 0.5) * 5))
    L.spark.push(15 + L.cpu * 0.8)
    if (L.spark.length > 20) L.spark.shift()
  })
}
const netRxStatus = computed<string>(() => {
  const s = activeConnection.value
  if (!s) return '—'
  const L = live.value[s.id]
  return fmtRate(L ? L.rx : s.rx)
})
const netTxStatus = computed<string>(() => {
  const s = activeConnection.value
  if (!s) return '—'
  const L = live.value[s.id]
  return fmtRate(L ? L.tx : s.tx)
})

export function useApp() {
  return {
    // constants
    GROUPS_DEFAULT, THEMES, ICONS,
    // i18n / theme
    lang, toggleLang, t, tGroup, themeI18nKey,
    theme, setTheme, themePopOpen,
    // sidebar
    servers, groups, search, sidebarGroups, collapsed, isCollapsed, toggleGroup,
    groupEdit, groupInput, startNewGroup, startRenameGroup, commitGroupEdit, cancelGroupEdit,
    deleteGroupAction, openServer, serverById, openAddModal,
    // tabs / terminal
    tabs, activeTab, activeTabObj, activeConnection, hasConnection, activeKind,
    openTab, activateTab, closeTab, newTab, openFiles, openProc,
    termInput, runCommand, activeTermTab, activeTermServer,
    // files
    activeFilesTab, filesServer, filesNode, filesEntries, filesCrumbs, filesNewItem,
    sortFiles, navTo, upOne, refreshFiles, startNewItem, startRename, cancelNewItem, commitNewItem, deleteEntry, openEditor, fmtSize, joinPath,
    // procs
    activeProcTab, procServer, procRows, sortProc, refreshProcs, killProc, procHeat,
    // inspector / status
    inspectorVisible, isWide, mainGrid, sparkBars, cpuLive, memLive, netRx, netTx, reconnectAction,
    statusConnection, netRxStatus, netTxStatus, clock,
    // modals
    showCloseModal, showAddModal, showEditModal, addForm, addProto, addAuth,
    submitAdd, confirmClose, editorContent, editorMeta, editingTitle, editingPath, editingPerm, saveEditor, closeEditor,
    // chrome
    minimized, minimize, restore, disconnected, panelOpen, togglePanel, demoConnect,
    // toasts / ctx
    toasts, ctxMenu, openCtx, closeCtx, runCtxItem,
    // lifecycle
    tick, toast, applyTheme
  }
}
