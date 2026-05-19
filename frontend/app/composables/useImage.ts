/**
 * Imágenes del seed vienen de `picsum.photos` (paisajes/comida random) y
 * rompen la coherencia visual de una plataforma deportiva. Mientras el
 * negocio no suba sus fotos reales, las descartamos y mostramos un
 * placeholder deportivo local (gradiente verde + icono de cancha).
 *
 * Si la URL es real (uploads propios o CDN del negocio), la dejamos pasar.
 */
export function isPicsumUrl(url: unknown): boolean {
  return typeof url === 'string' && /picsum\.photos/i.test(url)
}

/** Devuelve la URL si es válida y no proviene del seed picsum; de lo
 *  contrario `''` para que el componente caiga al placeholder. */
export function safeCover(url: unknown): string {
  if (typeof url !== 'string' || !url) return ''
  if (isPicsumUrl(url)) return ''
  return url
}
