<template>
  <v-app theme="tucancha">
    <template v-if="authStore.isBusiness">
      <div class="owner-shell">
        <aside class="owner-sidebar">
          <div>
            <div class="owner-brand">Panel del negocio</div>
            <p class="owner-brand-sub">Gestiona tus canchas</p>
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
              <div>
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
          <NuxtLink to="/" class="dash-nav-brand">TuCancha</NuxtLink>
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
.owner-shell { display: grid; grid-template-columns: 320px 1fr; min-height: 100vh; }
.owner-sidebar {
  border-right: 1px solid rgba(255,255,255,.08);
  background: #0d1319;
  padding: 26px 18px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.owner-brand { color: #63df89; font-size: 2rem; font-weight: 800; }
.owner-brand-sub { color: #a4b0ba; margin-top: 2px; }
.owner-nav { display: flex; flex-direction: column; gap: 8px; }
.owner-link {
  color: #c3ccd4;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 12px 14px;
}
.owner-link.router-link-active { background: #67dc8b; color: #0e1f14; font-weight: 700; }
.owner-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
.owner-user { display: flex; align-items: center; gap: 10px; }
.owner-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 700;
  background: linear-gradient(135deg, #67dc8b, #2ab963);
  color: #112218;
}
.owner-user-name { color: #e7edf3; font-weight: 700; }
.owner-user-role { color: #95a0ab; font-size: .85rem; }
.owner-main { background: #0f1318; }
.owner-content { padding: 30px 24px; }
.owner-content > * {
  animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both;
}
.owner-content > *:nth-child(2) { animation-delay: .03s; }
.owner-content > *:nth-child(3) { animation-delay: .06s; }
.owner-content > *:nth-child(4) { animation-delay: .09s; }

.dash-nav {
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(12,16,22,.9);
}
.dash-nav-inner {
  max-width: 1320px; margin: 0 auto; height: 72px; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.dash-nav-brand { color: #63df89; font-weight: 800; text-decoration: none; font-size: 1.6rem; }
.dash-nav-links { display: flex; gap: 18px; }
.dash-nav-link { color: #bbc4ce; text-decoration: none; }
.dash-nav-link.router-link-active { color: #67dc8b; }
.dash-nav-avatar {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, #67dc8b, #2ab963); color: #0f1b13;
}
.dash-main { min-height: calc(100vh - 72px); }
.dash-content { max-width: 1320px; margin: 0 auto; padding: 26px 24px; }
.dash-content > * {
  animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both;
}
.dash-content > *:nth-child(2) { animation-delay: .03s; }
.dash-content > *:nth-child(3) { animation-delay: .06s; }
.dash-content > *:nth-child(4) { animation-delay: .09s; }

@media (max-width: 980px) {
  .owner-shell { grid-template-columns: 1fr; }
  .owner-sidebar { border-right: none; border-bottom: 1px solid rgba(255,255,255,.08); }
}
</style>
