<template>
  <v-app theme="tucancha">
    <header class="client-nav">
      <div class="client-nav-inner">
        <NuxtLink to="/" class="client-brand">TuCancha</NuxtLink>

        <nav class="client-links">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="client-link">{{ item.title }}</NuxtLink>
        </nav>

        <div class="client-right">
          <button class="client-icon-btn" aria-label="Notificaciones"><v-icon icon="mdi-bell-outline" size="20" /></button>
          <v-menu location="bottom end" offset="10">
            <template #activator="{ props }">
              <button v-bind="props" class="client-icon-btn" aria-label="Menú de usuario">
                <v-icon icon="mdi-account-circle-outline" size="22" />
              </button>
            </template>
            <v-list density="comfortable" rounded="lg" min-width="230" class="pa-2">
              <div class="px-3 py-2">
                <div class="text-body-2 font-weight-bold">{{ authStore.fullName }}</div>
                <div class="text-caption brand-muted">{{ authStore.user?.email }}</div>
              </div>
              <v-divider class="my-1" />
              <v-list-item to="/dashboard" prepend-icon="mdi-home-outline" title="Inicio" rounded="lg" />
              <v-list-item to="/client/courts" prepend-icon="mdi-soccer-field" title="Explorar" rounded="lg" />
              <v-list-item to="/client/bookings" prepend-icon="mdi-calendar-account-outline" title="Mis Reservas" rounded="lg" />
              <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Mi Perfil" rounded="lg" />
              <v-divider class="my-1" />
              <v-list-item prepend-icon="mdi-logout" title="Cerrar Sesión" rounded="lg" base-color="error" @click="handleLogout" />
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
          <div class="client-footer-brand">TuCancha</div>
          <p>© 2024 TuCancha. Premium Soccer Field Booking.</p>
        </div>
        <div class="client-footer-links">
          <a href="#">Privacidad</a><a href="#">Términos</a><a href="#">Contacto</a><a href="#">Soporte</a>
        </div>
      </div>
    </footer>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const navItems = [
  { to: '/dashboard', title: 'Inicio' },
  { to: '/client/courts', title: 'Explorar' },
  { to: '/client/bookings', title: 'Mis Reservas' },
]
const handleLogout = async () => { authStore.logout(); await navigateTo('/auth/login') }
</script>

<style scoped>
.client-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(12, 16, 22, 0.9);
  backdrop-filter: blur(14px);
}
.client-nav-inner {
  max-width: 1520px;
  margin: 0 auto;
  height: 84px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.client-brand {
  text-decoration: none;
  color: #63df89;
  font-size: 2.45rem;
  font-size: clamp(1.7rem, 2.1vw, 2.45rem);
  font-weight: 800;
}
.client-links {
  display: flex;
  align-items: center;
  gap: 34px;
}
.client-link {
  color: #c3cad2;
  text-decoration: none;
  font-size: 1.4rem;
  font-size: clamp(.95rem,1.2vw,1.4rem);
  padding-bottom: 7px;
  border-bottom: 3px solid transparent;
  transition: color .2s ease, border-color .2s ease, transform .2s ease;
}
.client-link:hover {
  color: #d8e0e8;
  transform: translateY(-1px);
}
.client-link.router-link-active {
  color: #62df8b;
  border-color: #62df8b;
  font-weight: 700;
}
.client-right { display: flex; align-items: center; gap: 10px; }
.client-icon-btn {
  border: none;
  background: transparent;
  color: #bcc4cc;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}
.client-icon-btn:hover {
  background: rgba(255,255,255,.06);
  color: #e8eef5;
  transform: translateY(-1px);
}

.client-main { min-height: calc(100vh - 84px); }
.client-content {
  max-width: 1520px;
  margin: 0 auto;
  padding: 30px 32px 40px;
}
.client-content > * {
  animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both;
}
.client-content > *:nth-child(2) { animation-delay: .03s; }
.client-content > *:nth-child(3) { animation-delay: .06s; }
.client-content > *:nth-child(4) { animation-delay: .09s; }

.client-footer {
  border-top: 1px solid rgba(255,255,255,.08);
  background: #151b21;
  margin-top: 20px;
}
.client-footer-inner {
  max-width: 1520px;
  margin: 0 auto;
  padding: 28px 32px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #a7afb8;
}
.client-footer-brand {
  color: #64de8b;
  font-weight: 800;
  margin-bottom: 4px;
}
.client-footer-links { display: flex; gap: 24px; align-items: center; }
.client-footer-links a {
  color: #aab2ba;
  text-decoration: none;
  transition: color .2s ease;
}
.client-footer-links a:hover { color: #7be8a0; }

@media (max-width: 900px) {
  .client-nav-inner { padding: 0 16px; height: 70px; }
  .client-links { gap: 14px; }
  .client-content { padding: 18px 16px 28px; }
  .client-footer-inner { padding: 20px 16px; flex-direction: column; }
}
</style>
