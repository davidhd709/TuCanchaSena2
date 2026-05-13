export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  const path = to.path

  // Admin-only routes
  if (path.startsWith('/admin') && !authStore.isAdmin) {
    return navigateTo('/dashboard')
  }

  // Business-only routes
  if (path.startsWith('/business') && !authStore.isBusiness && !authStore.isAdmin) {
    return navigateTo('/dashboard')
  }

  // Client-only routes
  if (path.startsWith('/client') && !authStore.isClient) {
    return navigateTo('/dashboard')
  }
})
