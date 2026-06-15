export const useMouseGlow = () => {
  // Prevent execution on server-side rendering
  if (typeof window === 'undefined') return

  onMounted(() => {
    // Disable on mobile/touch screens to improve performance and UX
    if (window.innerWidth < 768 || window.matchMedia('(hover: none)').matches) return

    const glow = document.createElement('div')
    glow.id = 'mouse-glow'
    // Design: A soft ambient emerald/teal glow that follows the natural cursor
    glow.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(47, 161, 138, 0.15) 0%, rgba(47, 161, 138, 0) 70%);
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.5s ease;
      will-change: transform;
      transform: translate3d(-100% , -100%, 0);
      filter: blur(20px);
    `
    document.body.appendChild(glow)
    
    // We KEEP the default cursor now as requested
    document.documentElement.style.cursor = 'auto'

    // Tracking variables
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let isVisible = false
    let rafId: number

    const lerp = (start: number, end: number, amt: number) => {
      return (1 - amt) * start + amt * end
    }

    const animate = () => {
      // Increased reaction speed (0.2 instead of 0.1) to reduce lag on fast moves
      currentX = lerp(currentX, targetX, 0.2)
      currentY = lerp(currentY, targetY, 0.2)
      
      // Center the 250px glow on the cursor (125px offset)
      glow.style.transform = `translate3d(${currentX - 125}px, ${currentY - 125}px, 0)`
      rafId = requestAnimationFrame(animate)
    }

    const updateMouse = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      if (!isVisible) {
        // Snap to initial position immediately on first move to avoid coming from (0,0)
        currentX = targetX
        currentY = targetY
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
