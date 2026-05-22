/**
 * safeRedirectPath — valida un destino de redirección post-login.
 *
 * Solo admite rutas INTERNAS (empiezan con un único '/'), evitando open-redirects
 * hacia sitios externos (`//evil.com`, `/\evil.com`, `https://evil.com`).
 * Si el valor no es una ruta interna válida, devuelve `fallback`.
 *
 * Nota: se permite ':' dentro del path/query (p. ej. `?startTime=08:00`); solo se
 * bloquea el esquema completo `://`.
 */
export function safeRedirectPath(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string' || value.length === 0) return fallback
  // Debe empezar con '/' y no ser protocol-relative ('//host' o '/\host').
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  // Sin esquema embebido (http://, etc.).
  if (value.includes('://')) return fallback
  return value
}
