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
      <nav class="nav" aria-label="Top navigation">
        <div class="navInner">
          <div class="left">
            <RouterLink class="brand" to="/">Movie Web App</RouterLink>
            <div class="links">
              <RouterLink class="navLink" to="/">Home</RouterLink>
              <RouterLink v-if="auth.isAuthenticated" class="btnPrimary btnSm" to="/movies/new">
                Create Movie
              </RouterLink>
            </div>
          </div>

          <div class="spacer" />

          <div class="right">
            <template v-if="!auth.isAuthenticated">
              <RouterLink class="btnPrimary btnSm" to="/login">Login</RouterLink>
              <RouterLink class="btnPrimary btnSm" to="/register">Register</RouterLink>
            </template>
            <template v-else>
              <span class="user" title="Signed in user">{{ auth.currentUser?.email }}</span>
              <button type="button" class="btnSm" @click="onLogout">Logout</button>
            </template>
          </div>
        </div>
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
  padding: 10px 0;
}

.navInner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand {
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;
}

.links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.navLink {
	border: 1px solid transparent;
}

.navLink.router-link-active {
	border-color: var(--border);
	text-decoration: none;
}

.spacer {
  flex: 1;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user {
  opacity: 0.9;
  font-size: 13px;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content {
  min-height: calc(100vh - 56px);
}
</style>
