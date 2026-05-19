<template>
  <v-app theme="tucancha">
    <div class="client-shell">
      <header class="client-nav">
        <div class="client-nav-inner">
          <NuxtLink to="/dashboard" class="client-brand" aria-label="TuCancha — Inicio">
            <span class="client-brand-icon mdi mdi-soccer" />
            TuCancha
          </NuxtLink>

          <nav class="client-links" aria-label="Navegación principal">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="client-link"
            >
              {{ item.title }}
            </NuxtLink>
          </nav>

          <div class="client-right">
            <v-menu location="bottom end" offset="10">
              <template #activator="{ props }">
                <button v-bind="props" class="client-profile" aria-label="Menú de usuario">
                  <span class="client-profile-avatar">{{ initials }}</span>
                  <span class="client-profile-name">{{ firstName }}</span>
                  <v-icon icon="mdi-chevron-down" size="18" />
                </button>
              </template>
              <v-list density="comfortable" rounded="lg" min-width="240" class="pa-2">
                <div class="px-3 py-2">
                  <div class="text-body-2 font-weight-bold">{{ authStore.fullName }}</div>
                  <div class="text-caption brand-muted">{{ authStore.user?.email }}</div>
                </div>
                <v-divider class="my-1" />
                <v-list-item to="/dashboard" prepend-icon="mdi-home-outline" title="Inicio" rounded="lg" />
                <v-list-item to="/client/businesses" prepend-icon="mdi-stadium-variant" title="Negocios" rounded="lg" />
                <v-list-item to="/client/courts" prepend-icon="mdi-soccer-field" title="Canchas" rounded="lg" />
                <v-list-item to="/client/bookings" prepend-icon="mdi-calendar-account-outline" title="Mis reservas" rounded="lg" />
                <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Mi perfil" rounded="lg" />
                <v-divider class="my-1" />
                <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" rounded="lg" base-color="error" @click="handleLogout" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </header>

      <main class="client-main">
        <div class="client-content"><slot /></div>
      </main>

      <footer class="client-footer">
        <div class="client-footer-inner">
          <div>
            <div class="client-footer-brand">
              <span class="client-brand-icon mdi mdi-soccer" />
              TuCancha
            </div>
            <p>© 2026 TuCancha · Reserva canchas sintéticas en minutos.</p>
          </div>
          <div class="client-footer-links">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Soporte</a>
          </div>
        </div>
      </footer>

      <nav class="client-bottom-nav" aria-label="Navegación móvil">
        <NuxtLink to="/dashboard" class="client-bottom-link">
          <span class="mdi mdi-home-variant-outline" />
          <span>Inicio</span>
        </NuxtLink>
        <NuxtLink to="/client/businesses" class="client-bottom-link">
          <span class="mdi mdi-stadium-variant" />
          <span>Negocios</span>
        </NuxtLink>
        <NuxtLink to="/client/courts" class="client-bottom-link">
          <span class="mdi mdi-soccer-field" />
          <span>Canchas</span>
        </NuxtLink>
        <NuxtLink to="/client/bookings" class="client-bottom-link">
          <span class="mdi mdi-calendar-check-outline" />
          <span>Reservas</span>
        </NuxtLink>
      </nav>
    </div>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const initials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName?.[0] ?? ''}${authStore.user.lastName?.[0] ?? ''}`.toUpperCase()
})
const firstName = computed(() => authStore.user?.firstName ?? 'Cliente')
const navItems = [
  { to: '/dashboard', title: 'Inicio' },
  { to: '/client/businesses', title: 'Negocios' },
  { to: '/client/courts', title: 'Canchas' },
  { to: '/client/bookings', title: 'Mis reservas' },
]
const handleLogout = async () => { authStore.logout(); await navigateTo('/auth/login') }
</script>

<style scoped>
.client-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Top nav dark premium ─────────────────────────────────────────────── */
.client-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(12, 16, 20, 0.78);
  backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid var(--border-soft);
}
.client-nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 68px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.client-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--green-bright);
  text-decoration: none;
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.client-brand-icon {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--green-soft);
  color: var(--green-bright);
  font-size: 1.15rem;
}
.client-links {
  display: flex;
  gap: 28px;
  margin-left: 24px;
  flex: 1;
}
.client-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: .92rem;
  font-weight: 600;
  padding: 6px 2px;
  border-bottom: 2px solid transparent;
  transition: color .2s ease, border-color .2s ease;
}
.client-link:hover { color: var(--text-primary); }
.client-link.router-link-active {
  color: var(--green-bright);
  border-bottom-color: var(--green-bright);
}

.client-right { display: flex; align-items: center; gap: 8px; }
.client-profile {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: .85rem;
  font-weight: 700;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.client-profile:hover { border-color: var(--green-bright); box-shadow: var(--shadow-sm); }
.client-profile-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: inline-grid; place-items: center;
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  color: #04170f;
  font-size: .72rem;
  font-weight: 800;
}
.client-profile-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Main ──────────────────────────────────────────────────────────────── */
.client-main { flex: 1; display: flex; flex-direction: column; }
.client-content {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px 60px;
}
.client-content > * {
  animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both;
}

/* ── Footer ────────────────────────────────────────────────────────────── */
.client-footer {
  border-top: 1px solid var(--border-soft);
  background: var(--bg-subtle);
}
.client-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
  font-size: .85rem;
}
.client-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--green-bright);
  font-weight: 800;
  margin-bottom: 4px;
}
.client-footer-links { display: flex; gap: 22px; }
.client-footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  transition: color .2s ease;
}
.client-footer-links a:hover { color: var(--green-bright); }

/* ── Bottom nav móvil ──────────────────────────────────────────────────── */
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
.client-bottom-link .mdi { font-size: 1.3rem; }
.client-bottom-link.router-link-active {
  color: var(--green-bright);
  background: var(--green-soft);
}

@media (max-width: 900px) {
  .client-nav-inner { height: 60px; padding: 0 16px; gap: 12px; }
  .client-links { display: none; }
  .client-content { padding: 18px 16px 100px; }
  .client-profile-name { display: none; }
  .client-footer-inner { padding: 18px 16px; flex-direction: column; align-items: flex-start; }
  .client-bottom-nav { display: flex; }
}
</style>
