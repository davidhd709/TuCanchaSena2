export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }
})
