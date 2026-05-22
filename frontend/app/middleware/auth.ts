export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  if (!authStore.isAuthenticated) {
    // Guardamos el destino para volver a él tras iniciar sesión.
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }
})
