<script setup lang="ts">
import { useApp } from '../composables/useApp'

const { ctxMenu, runCtxItem } = useApp()
</script>

<template>
  <div
    v-if="ctxMenu.show"
    class="ctx-menu fixed z-[80] min-w-[178px] bg-surface3 border border-line rounded-md p-1.5 shadow-[0_16px_40px_-12px_var(--shadow-color)]"
    :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
  >
    <template v-for="(item, i) in ctxMenu.items" :key="i">
      <div v-if="item.sep" class="h-px bg-line-soft my-1 mx-1.5"></div>
      <button
        v-else
        class="ctx-item w-full flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[12.5px] text-left transition-colors"
        :class="item.danger ? 'danger text-danger hover:bg-danger/14' : 'text-fg hover:bg-surface2'"
        @click="runCtxItem(item)"
      >
        <span v-html="item.icon ?? ''" class="shrink-0"></span>
        <span class="flex-1">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>
