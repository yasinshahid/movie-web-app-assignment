<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function onLogout() {
  auth.logout();
  await router.push('/login');
}
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <nav class="nav">
        <div class="left">
          <RouterLink class="navLink brand" to="/">Home</RouterLink>
          <RouterLink v-if="auth.isAuthenticated" class="navLink" to="/movies/new">
            Create Movie
          </RouterLink>
        </div>

        <div class="spacer" />

        <template v-if="!auth.isAuthenticated">
          <RouterLink class="navLink" to="/login">Login</RouterLink>
          <RouterLink class="navLink" to="/register">Register</RouterLink>
        </template>
        <template v-else>
          <span class="user">{{ auth.currentUser?.email }}</span>
          <button type="button" class="btnSm" @click="onLogout">Logout</button>
        </template>
      </nav>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.topbar {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand {
  font-weight: 700;
}

.spacer {
  flex: 1;
}

.user {
  opacity: 0.9;
}

.content {
  min-height: calc(100vh - 56px);
}
</style>
