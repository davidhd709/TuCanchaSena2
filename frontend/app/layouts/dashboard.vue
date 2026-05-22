<template>
  <v-app theme="tucancha">
    <template v-if="authStore.isBusiness">
      <!-- ── Mobile top bar ── -->
      <header class="owner-topbar">
        <button class="owner-topbar-hamburger" aria-label="Abrir menú" @click="drawerOpen = true">
          <span class="mdi mdi-menu" />
        </button>
        <NuxtLink to="/dashboard" aria-label="TuCancha — Inicio">
          <img src="/logo-nav.webp" alt="TuCancha" class="owner-topbar-logo" />
        </NuxtLink>
        <span class="owner-avatar owner-topbar-avatar">{{ initials }}</span>
      </header>

      <!-- ── Mobile drawer overlay ── -->
      <transition name="overlay-fade">
        <div v-if="drawerOpen" class="owner-drawer-overlay" @click="drawerOpen = false" />
      </transition>

      <!-- ── Mobile drawer ── -->
      <transition name="drawer-slide">
        <aside v-if="drawerOpen" class="owner-drawer" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div class="owner-drawer-head">
            <NuxtLink to="/dashboard" aria-label="TuCancha — Inicio" @click="drawerOpen = false">
              <img src="/logo-nav.webp" alt="TuCancha" class="owner-brand-logo" />
            </NuxtLink>
            <button class="owner-drawer-close" aria-label="Cerrar menú" @click="drawerOpen = false">
              <span class="mdi mdi-close" />
            </button>
          </div>
          <p class="owner-brand-sub">Panel del negocio</p>

          <nav class="owner-nav" @click="drawerOpen = false">
            <NuxtLink v-for="item in businessNav" :key="item.to" :to="item.to" class="owner-link">
              <v-icon :icon="item.icon" size="20" /> {{ item.title }}
            </NuxtLink>
          </nav>

          <div class="owner-bottom">
            <v-btn color="primary" block size="large" to="/business/courts" prepend-icon="mdi-plus" @click="drawerOpen = false">
              Nueva Cancha
            </v-btn>
            <div class="owner-user">
              <span class="owner-avatar">{{ initials }}</span>
              <div class="owner-user-info">
                <div class="owner-user-name">{{ authStore.fullName }}</div>
                <div class="owner-user-role">Dueño del negocio</div>
              </div>
            </div>
            <v-btn variant="text" color="error" prepend-icon="mdi-logout" @click="handleLogout">Cerrar Sesión</v-btn>
          </div>
        </aside>
      </transition>

      <!-- ── Desktop shell ── -->
      <div class="owner-shell">
        <aside class="owner-sidebar">
          <div>
            <NuxtLink to="/dashboard" aria-label="TuCancha — Inicio">
              <img src="/logo-nav.webp" alt="TuCancha" class="owner-brand-logo" />
            </NuxtLink>
            <p class="owner-brand-sub">Panel del negocio</p>
          </div>

          <nav class="owner-nav">
            <NuxtLink v-for="item in businessNav" :key="item.to" :to="item.to" class="owner-link">
              <v-icon :icon="item.icon" size="20" /> {{ item.title }}
            </NuxtLink>
          </nav>

          <div class="owner-bottom">
            <v-btn color="primary" block size="large" to="/business/courts" prepend-icon="mdi-plus">Nueva Cancha</v-btn>
            <div class="owner-user">
              <span class="owner-avatar">{{ initials }}</span>
              <div class="owner-user-info">
                <div class="owner-user-name">{{ authStore.fullName }}</div>
                <div class="owner-user-role">Dueño del negocio</div>
              </div>
            </div>
            <v-btn variant="text" color="error" prepend-icon="mdi-logout" @click="handleLogout">Cerrar Sesión</v-btn>
          </div>
        </aside>

        <main class="owner-main">
          <div class="owner-content"><slot /></div>
        </main>
      </div>
    </template>

    <template v-else>
      <header class="dash-nav">
        <div class="dash-nav-inner">
          <NuxtLink to="/dashboard" class="dash-nav-brand" aria-label="TuCancha — Inicio">
            <img src="/logo-nav.webp" alt="TuCancha" class="dash-nav-logo" />
          </NuxtLink>
          <nav class="dash-nav-links">
            <NuxtLink v-for="item in adminNav" :key="item.to" :to="item.to" class="dash-nav-link">{{ item.title }}</NuxtLink>
          </nav>
          <v-menu location="bottom end" offset="10">
            <template #activator="{ props }"><button v-bind="props" class="dash-nav-profile"><span class="dash-nav-avatar">{{ initials }}</span></button></template>
            <v-list density="comfortable" rounded="lg" min-width="220" class="pa-2">
              <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Mi Perfil" rounded="lg" />
              <v-list-item prepend-icon="mdi-logout" title="Cerrar Sesión" rounded="lg" base-color="error" @click="handleLogout" />
            </v-list>
          </v-menu>
        </div>
      </header>
      <main class="dash-main"><div class="dash-content"><slot /></div></main>
    </template>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const drawerOpen = ref(false)

// Cierra el drawer automáticamente al cambiar de ruta
watch(() => route.fullPath, () => { drawerOpen.value = false })

const initials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName[0]}${authStore.user.lastName[0]}`.toUpperCase()
})

const adminNav = [
  { to: '/dashboard', title: 'Inicio' },
  { to: '/admin/users', title: 'Usuarios' },
  { to: '/admin/businesses', title: 'Negocios' },
  { to: '/admin/courts', title: 'Canchas' },
  { to: '/admin/bookings', title: 'Reservas' },
]

const businessNav = [
  { to: '/dashboard', icon: 'mdi-view-dashboard-outline', title: 'Inicio' },
  { to: '/business/courts', icon: 'mdi-soccer-field', title: 'Canchas' },
  { to: '/business/bookings', icon: 'mdi-calendar-check-outline', title: 'Reservas' },
  { to: '/business', icon: 'mdi-store-outline', title: 'Mi Negocio' },
]

const handleLogout = async () => { authStore.logout(); await navigateTo('/auth/login') }
</script>

<style scoped>
/* ── Mobile top bar (solo visible en móvil) ──────────────────────────── */
.owner-topbar {
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
.owner-topbar-logo { height: 32px; width: auto; display: block; }
.owner-topbar-hamburger {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1.3rem;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.owner-topbar-hamburger:hover { background: var(--bg-card); border-color: var(--border-medium); }
.owner-topbar-avatar {
  width: 36px !important; height: 36px !important;
  font-size: .78rem !important;
}

/* ── Mobile drawer overlay ───────────────────────────────────────────── */
.owner-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 299;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(2px);
}
.overlay-fade-enter-active,
.overlay-fade-leave-active { transition: opacity .25s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to { opacity: 0; }

/* ── Mobile drawer ───────────────────────────────────────────────────── */
.owner-drawer {
  position: fixed;
  inset: 0 auto 0 0;
  width: min(300px, 88vw);
  z-index: 300;
  background: linear-gradient(180deg, var(--bg-subtle), var(--bg-app));
  border-right: 1px solid var(--border-soft);
  padding: 20px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.owner-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.owner-drawer-close {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}
.owner-drawer-close:hover { color: var(--text-primary); background: var(--bg-card); }

.drawer-slide-enter-active { transition: transform .28s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-slide-leave-active  { transition: transform .22s cubic-bezier(0.55, 0, 1, 0.45); }
.drawer-slide-enter-from,
.drawer-slide-leave-to { transform: translateX(-100%); }

/* ── Desktop shell ───────────────────────────────────────────────────── */
.owner-shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
.owner-sidebar {
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
.owner-brand-logo { height: 38px; width: auto; display: block; }
.owner-brand-sub { color: var(--text-muted); font-size: .82rem; margin-top: 8px; }
.owner-nav { display: flex; flex-direction: column; gap: 4px; }
.owner-link {
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
.owner-link:hover { background: var(--bg-elev); color: var(--text-primary); }
.owner-link.router-link-active {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.28);
  font-weight: 800;
}
.owner-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
.owner-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
}
.owner-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 800; font-size: .82rem;
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  color: #04170f;
  flex-shrink: 0;
}
.owner-user-info { flex: 1; min-width: 0; }
.owner-user-name {
  color: var(--text-primary);
  font-weight: 700;
  font-size: .9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.owner-user-role { color: var(--text-muted); font-size: .76rem; }
.owner-main { background: transparent; min-width: 0; }
.owner-content { padding: 30px 28px; max-width: 1280px; width: 100%; margin: 0 auto; }
.owner-content > * { animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both; }
.owner-content > *:nth-child(2) { animation-delay: .03s; }
.owner-content > *:nth-child(3) { animation-delay: .06s; }
.owner-content > *:nth-child(4) { animation-delay: .09s; }

/* ── Admin nav (sin cambios) ─────────────────────────────────────────── */
.dash-nav {
  border-bottom: 1px solid var(--border-soft);
  background: rgba(12, 16, 20, 0.78);
  backdrop-filter: blur(14px) saturate(140%);
  position: sticky;
  top: 0;
  z-index: 100;
}
.dash-nav-inner {
  max-width: 1320px; margin: 0 auto; height: 68px; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.dash-nav-brand { display: inline-flex; align-items: center; text-decoration: none; }
.dash-nav-logo { height: 34px; width: auto; display: block; }
.dash-nav-links { display: flex; gap: 22px; }
.dash-nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: .92rem;
  font-weight: 600;
  padding: 6px 2px;
  border-bottom: 2px solid transparent;
  transition: color .2s ease, border-color .2s ease;
}
.dash-nav-link:hover { color: var(--text-primary); }
.dash-nav-link.router-link-active { color: var(--green-bright); border-bottom-color: var(--green-bright); }
.dash-nav-profile {
  border: 1px solid var(--border-medium);
  background: var(--bg-card);
  border-radius: var(--radius-pill);
  padding: 3px;
  cursor: pointer;
  transition: border-color .2s ease;
}
.dash-nav-profile:hover { border-color: var(--green-bright); }
.dash-nav-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  color: #04170f;
  font-weight: 800;
  display: inline-grid;
  place-items: center;
  font-size: .78rem;
}
.dash-main { min-height: calc(100vh - 68px); }
.dash-content { max-width: 1320px; margin: 0 auto; padding: 28px 24px; }
.dash-content > * { animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both; }
.dash-content > *:nth-child(2) { animation-delay: .03s; }
.dash-content > *:nth-child(3) { animation-delay: .06s; }
.dash-content > *:nth-child(4) { animation-delay: .09s; }

/* ── Tablet: sidebar más angosta ─────────────────────────────────────── */
@media (max-width: 1100px) and (min-width: 769px) {
  .owner-shell { grid-template-columns: 240px 1fr; }
  .owner-content { padding: 24px 20px; }
}

/* ── Móvil: ocultar sidebar, mostrar topbar ──────────────────────────── */
@media (max-width: 768px) {
  .owner-topbar { display: flex; }
  .owner-shell  { display: block; }
  .owner-sidebar { display: none; }
  .owner-content { padding: 18px 14px; }
}
</style>
