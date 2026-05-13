<template>
  <v-app :theme="theme">
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      :color="drawerColor"
    >
      <!-- Logo -->
      <v-list-item
        prepend-icon="mdi-soccer-field"
        :title="rail ? '' : 'Canchas Sintéticas'"
        :subtitle="rail ? '' : authStore.roleLabel"
        nav
        class="py-4"
      >
        <template #append>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="rail = !rail"
          />
        </template>
      </v-list-item>

      <v-divider />

      <!-- Navigation Items -->
      <v-list density="compact" nav class="mt-2">
        <template v-for="item in navItems" :key="item.to">
          <!-- Group with children -->
          <v-list-group v-if="item.children" :value="item.title">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
                rounded="lg"
              />
            </template>
            <v-list-item
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              :prepend-icon="child.icon"
              :title="child.title"
              rounded="lg"
              active-color="primary"
            />
          </v-list-group>

          <!-- Single item -->
          <v-list-item
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            active-color="primary"
          />
        </template>
      </v-list>

      <template #append>
        <v-divider />
        <v-list density="compact" nav class="my-2">
          <v-list-item
            to="/profile"
            prepend-icon="mdi-account-circle"
            title="Mi Perfil"
            rounded="lg"
            active-color="primary"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar Sesión"
            rounded="lg"
            @click="handleLogout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Top App Bar -->
    <v-app-bar elevation="0" border="b">
      <v-app-bar-title>
        <span class="text-body-1 font-weight-medium">{{ currentPageTitle }}</span>
      </v-app-bar-title>
      <template #append>
        <v-btn icon @click="toggleTheme" class="mr-1">
          <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
        </v-btn>
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" class="mr-2" variant="tonal" rounded="lg">
              <v-avatar size="28" color="primary" class="mr-2">
                <span class="text-caption font-weight-bold text-white">{{ initials }}</span>
              </v-avatar>
              <span v-if="!$vuetify.display.smAndDown" class="text-body-2">{{ authStore.fullName }}</span>
              <v-icon end>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" rounded="lg" min-width="180">
            <v-list-item to="/profile" prepend-icon="mdi-account" title="Mi Perfil" />
            <v-divider />
            <v-list-item prepend-icon="mdi-logout" title="Cerrar Sesión" @click="handleLogout" />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="background: #F5F7FA">
      <v-container fluid class="pa-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const drawer = ref(true)
const rail = ref(false)
const theme = ref('light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const drawerColor = computed(() =>
  theme.value === 'dark' ? '#1a1a2e' : 'white'
)

const initials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName[0]}${authStore.user.lastName[0]}`.toUpperCase()
})

// Navigation items per role
const adminNav = [
  { to: '/dashboard', icon: 'mdi-view-dashboard', title: 'Dashboard' },
  { to: '/admin/users', icon: 'mdi-account-group', title: 'Usuarios' },
  { to: '/admin/businesses', icon: 'mdi-store', title: 'Negocios' },
  { to: '/admin/courts', icon: 'mdi-soccer-field', title: 'Canchas' },
  { to: '/admin/bookings', icon: 'mdi-calendar-check', title: 'Reservas' },
  { to: '/admin/software', icon: 'mdi-application', title: 'Software' },
]

const businessNav = [
  { to: '/dashboard', icon: 'mdi-view-dashboard', title: 'Dashboard' },
  { to: '/business', icon: 'mdi-store', title: 'Mis Negocios' },
  { to: '/business/courts', icon: 'mdi-soccer-field', title: 'Mis Canchas' },
  { to: '/business/bookings', icon: 'mdi-calendar-check', title: 'Reservas' },
]

const clientNav = [
  { to: '/dashboard', icon: 'mdi-view-dashboard', title: 'Dashboard' },
  { to: '/client/courts', icon: 'mdi-soccer-field', title: 'Explorar Canchas' },
  { to: '/client/bookings', icon: 'mdi-calendar-account', title: 'Mis Reservas' },
]

const navItems = computed(() => {
  if (authStore.isAdmin) return adminNav
  if (authStore.isBusiness) return businessNav
  return clientNav
})

const currentPageTitle = computed(() => {
  const all = [...adminNav, ...businessNav, ...clientNav]
  const found = all.find((item) => item.to === route.path)
  return found?.title ?? 'Dashboard'
})

const handleLogout = () => {
  authStore.logout()
}
</script>
