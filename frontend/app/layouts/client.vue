<template>
  <v-app theme="tucancha">
    <!-- ── Mobile top bar (logo + menú de perfil) ── -->
    <header class="client-topbar">
      <NuxtLink to="/dashboard" aria-label="TuCancha — Inicio">
        <img src="/logo-nav.webp" alt="TuCancha" class="client-topbar-logo" />
      </NuxtLink>
      <v-menu location="bottom end" offset="10">
        <template #activator="{ props }">
          <button v-bind="props" class="client-topbar-profile" aria-label="Menú de usuario">
                        <span class="client-avatar client-topbar-avatar">
              <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="client-avatar-img" alt="avatar" />
              <template v-else>{{ initials }}</template>
            </span>
          </button>
        </template>
        <v-list density="comfortable" rounded="lg" min-width="220" class="pa-2">
          <div class="px-3 py-2">
            <div class="text-body-2 font-weight-bold">{{ authStore.fullName }}</div>
            <div class="text-caption brand-muted">{{ authStore.user?.email }}</div>
          </div>
          <v-divider class="my-1" />
          <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Mi perfil" rounded="lg" />
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" rounded="lg" base-color="error" @click="handleLogout" />
        </v-list>
      </v-menu>
    </header>

    <!-- ── Desktop shell (sidebar) ── -->
    <div class="client-shell">
      <aside class="client-sidebar">
        <div>
          <NuxtLink to="/dashboard" aria-label="TuCancha — Inicio">
            <img src="/logo-nav.webp" alt="TuCancha" class="client-brand-logo" />
          </NuxtLink>
          <p class="client-brand-sub">Panel de usuario</p>
        </div>

        <nav class="client-nav">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="client-link">
            <v-icon :icon="item.icon" size="20" /> {{ item.title }}
          </NuxtLink>
        </nav>

        <div class="client-bottom">
          <!-- Opcional: botón destacado para clientes, p. ej. "Explorar Canchas" -->
          <v-btn
            color="primary"
            block
            size="large"
            to="/client/courts"
            prepend-icon="mdi-magnify"
          >
            Buscar Cancha
          </v-btn>
          <div class="client-user">
                        <span class="client-avatar">
              <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="client-avatar-img" alt="avatar" />
              <template v-else>{{ initials }}</template>
            </span>
            <div class="client-user-info">
              <div class="client-user-name">{{ authStore.fullName }}</div>
              <div class="client-user-role">Cliente</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <v-btn variant="text" prepend-icon="mdi-account-outline" to="/profile" class="justify-start text-none" style="color: var(--text-secondary)">Mi Perfil</v-btn>
            <v-btn variant="text" color="error" prepend-icon="mdi-logout" @click="handleLogout" class="justify-start text-none">Cerrar Sesión</v-btn>
          </div>
        </div>
      </aside>

      <main class="client-main">
        <div class="client-content"><slot /></div>
      </main>
    </div>

    <!-- ── Bottom nav móvil ── -->
    <nav class="client-bottom-nav" aria-label="Navegación móvil">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="client-bottom-link"
      >
        <v-icon :icon="item.icon" size="22" />
        <span>{{ item.short }}</span>
      </NuxtLink>
    </nav>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const initials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName?.[0] ?? ''}${authStore.user.lastName?.[0] ?? ''}`.toUpperCase()
})

const navItems = [
  { to: '/dashboard', icon: 'mdi-view-dashboard-outline', title: 'Inicio', short: 'Inicio' },
  { to: '/client/businesses', icon: 'mdi-store-outline', title: 'Negocios', short: 'Negocios' },
  { to: '/client/courts', icon: 'mdi-soccer-field', title: 'Canchas', short: 'Canchas' },
  { to: '/client/bookings', icon: 'mdi-calendar-check-outline', title: 'Reservas', short: 'Reservas' },
]

const handleLogout = async () => { authStore.logout(); await navigateTo('/auth/login') }
</script>

<style scoped>
/* ── Mobile top bar (solo visible en móvil) ──────────────────────────── */
.client-topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 58px;
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(12, 16, 20, 0.92);
  backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid var(--border-soft);
}
.client-topbar-logo { height: 32px; width: auto; display: block; }
.client-topbar-profile {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  border-radius: 50%;
}
.client-topbar-avatar {
  width: 36px !important; height: 36px !important;
  font-size: .78rem !important;
}

/* ── Bottom nav móvil (mismo patrón que el dueño) ──────────────────── */
.client-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(12, 16, 20, 0.92);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--border-soft);
  padding: 8px 8px max(8px, env(safe-area-inset-bottom));
  justify-content: space-around;
}
.client-bottom-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: .68rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  transition: color .2s ease, background .2s ease;
}
.client-bottom-link.router-link-exact-active {
  color: var(--green-bright);
  background: var(--green-soft);
}

/* ── Desktop shell ───────────────────────────────────────────────────── */
.client-shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
.client-sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  max-height: 100vh;
  border-right: 1px solid var(--border-soft);
  background: linear-gradient(180deg, var(--bg-subtle), var(--bg-app));
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.client-brand-logo { height: 38px; width: auto; display: block; }
.client-brand-sub { color: var(--text-muted); font-size: .82rem; margin-top: 8px; }
.client-nav { display: flex; flex-direction: column; gap: 4px; }
.client-link {
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: var(--radius-md);
  padding: 11px 14px;
  font-size: .92rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}
.client-link:hover { background: var(--bg-elev); color: var(--text-primary); }
.client-link.router-link-active {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.28);
  font-weight: 800;
}
.client-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
.client-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
}
.client-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 800; font-size: .82rem;
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  color: #04170f;
  flex-shrink: 0;
}
.client-user-info { flex: 1; min-width: 0; }
.client-user-name {
  color: var(--text-primary);
  font-weight: 700;
  font-size: .9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-user-role { color: var(--text-muted); font-size: .76rem; }
.client-main { background: transparent; min-width: 0; }
.client-content { padding: 30px 28px; max-width: 1280px; width: 100%; margin: 0 auto; }
.client-content > * { animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both; }
.client-content > *:nth-child(2) { animation-delay: .03s; }
.client-content > *:nth-child(3) { animation-delay: .06s; }
.client-content > *:nth-child(4) { animation-delay: .09s; }

/* ── Tablet: sidebar más angosta ─────────────────────────────────────── */
@media (max-width: 1100px) and (min-width: 769px) {
  .client-shell { grid-template-columns: 240px 1fr; }
  .client-content { padding: 24px 20px; }
}

/* ── Móvil: ocultar sidebar, mostrar topbar + bottom-nav ─────────────── */
@media (max-width: 768px) {
  .client-topbar { display: flex; }
  .client-shell  { display: block; }
  .client-sidebar { display: none; }
  /* padding inferior extra para no quedar tapado por la bottom-nav */
  .client-content { padding: 18px 14px 96px; }
  .client-bottom-nav { display: flex; }
}

.client-avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}
</style>

<style>
/* ── Estilos globales para arreglar desbordamientos en móvil (Hero) ──── */
.client-home-hero-actions {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
}
.client-home-hero-actions .v-btn {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  white-space: nowrap !important;
}
</style>
