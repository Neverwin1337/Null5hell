<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  GetServerList,
  NewServer,
  DeleteServer,
} from '../bindings/wails3-app/service/localstorageservice'
import type { Server } from '../bindings/wails3-app/model/models'

const servers = ref<Server[]>([])
const error = ref('')

const form = ref({
  name: '',
  ip: '',
  user: '',
  pw: '',
})

async function refresh() {
  try {
    servers.value = (await GetServerList()) ?? []
    error.value = ''
  } catch (e) {
    error.value = String(e)
  }
}

async function addServer() {
  try {
    await NewServer(0, form.value.name, form.value.ip, form.value.user, form.value.pw, '')
    form.value = { name: '', ip: '', user: '', pw: '' }
    await refresh()
  } catch (e) {
    error.value = String(e)
  }
}

async function removeServer(id: number) {
  try {
    await DeleteServer(id)
    await refresh()
  } catch (e) {
    error.value = String(e)
  }
}

onMounted(refresh)
</script>

<template>
  <main style="font-family: sans-serif; padding: 1.5rem; max-width: 640px; margin: 0 auto">
    <h2>LocalStorageService demo</h2>

    <div style="margin-bottom: 1rem">
      <input v-model="form.name" placeholder="Name" />
      <input v-model="form.ip" placeholder="IP" />
      <input v-model="form.user" placeholder="User" />
      <input v-model="form.pw" placeholder="Password" type="password" />
      <button @click="addServer">Add</button>
    </div>

    <p v-if="error" style="color: #c0392b">{{ error }}</p>

    <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%">
      <thead>
        <tr><th>ID</th><th>Name</th><th>IP</th><th>User</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="s in servers" :key="s.ID">
          <td>{{ s.ID }}</td>
          <td>{{ s.Name }}</td>
          <td>{{ s.IP }}</td>
          <td>{{ s.User }}</td>
          <td><button @click="removeServer(s.ID)">Delete</button></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
