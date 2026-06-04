export const useMouseGlow = () => {
  // Prevent execution on server-side rendering
  if (typeof window === 'undefined') return

  onMounted(() => {
    // Disable on mobile/touch screens to improve performance and UX
    if (window.innerWidth < 768 || window.matchMedia('(hover: none)').matches) return

    const glow = document.createElement('div')
    glow.id = 'mouse-glow'
    // Dot with blurred effect and contrast
    glow.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.8);
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: difference;
      opacity: 0;
      transition: opacity 0.3s ease;
      will-change: transform;
      transform: translate3d(-100px, -100px, 0);
    `
    document.body.appendChild(glow)
    
    // Hide the default cursor
    document.documentElement.style.cursor = 'none'

    // Using requestAnimationFrame for smooth 60fps hardware-accelerated tracking
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let currentX = targetX
    let currentY = targetY
    let isVisible = false
    let rafId: number

    const lerp = (start: number, end: number, amt: number) => {
      return (1 - amt) * start + amt * end
    }

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.25)
      currentY = lerp(currentY, targetY, 0.25)
      glow.style.transform = `translate3d(${currentX - 8}px, ${currentY - 8}px, 0)`
      rafId = requestAnimationFrame(animate)
    }

    const updateMouse = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      if (!isVisible) {
        glow.style.opacity = '1'
        isVisible = true
      }
    }

    const handleMouseLeave = () => {
      glow.style.opacity = '0'
      isVisible = false
    }

    window.addEventListener('mousemove', updateMouse, { passive: true })
    document.documentElement.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    
    // Start loop
    animate()

    onUnmounted(() => {
      window.removeEventListener('mousemove', updateMouse)
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafId)
      glow.remove()
      document.documentElement.style.cursor = ''
    })
  })
}
