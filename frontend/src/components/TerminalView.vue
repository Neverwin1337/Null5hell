<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useApp } from '../composables/useApp'

const { activeTermTab, activeTermServer, termInput, runCommand, t } = useApp()

const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

const prompt = computed(() => {
  const s = activeTermServer.value
  return s ? `${s.user}@${s.name}:~$` : '$'
})

function lineColor(type: string) {
  if (type === 'sys') return 'text-sys'
  if (type === 'out') return 'text-muted'
  if (type === 'err') return 'text-warn'
  return 'text-fg'
}

watch(() => activeTermTab.value && activeTermTab.value.lines.length, async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})
watch(activeTermTab, async () => {
  await nextTick()
  inputEl.value && inputEl.value.focus()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})

function onEnter() {
  runCommand()
  inputEl.value && inputEl.value.focus()
}
</script>

<template>
  <div v-if="activeTermTab" ref="scrollEl" class="term-scroll flex-1 overflow-y-auto px-[18px] py-3.5 font-mono text-[13px] leading-[1.55]" @click="inputEl && inputEl.focus()">
    <template v-for="(line, i) in activeTermTab.lines" :key="i">
      <div v-if="line.t === 'blank'" class="term-line blank h-[0.9em] min-h-0"></div>
      <div v-else class="term-line whitespace-pre-wrap break-all min-h-[1.55em]" :class="lineColor(line.t)">
        <span v-if="line.t === 'cmd'" class="prompt-p">{{ prompt }}</span>{{ line.h }}
      </div>
    </template>
    <div class="term-line input-row flex items-center">
      <span class="prompt-p">{{ prompt }}</span>
      <input
        ref="inputEl"
        v-model="termInput"
        :aria-label="t('termInput')"
        autocomplete="off"
        spellcheck="false"
        class="term-input flex-1 min-w-0 bg-transparent border-0 outline-0 text-fg caret-accent"
        @keydown.enter="onEnter"
        @click.stop
      >
    </div>
  </div>
</template>
