export const useMouseGlow = () => {
  onMounted(() => {
    const glow = document.createElement('div')
    glow.id = 'mouse-glow'
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(52, 198, 146, 0.9) 0%, rgba(52, 198, 146, 0.5) 20%, rgba(52, 198, 146, 0.15) 50%, transparent 70%);
      box-shadow: 0 0 60px rgba(52, 198, 146, 0.6), inset 0 0 60px rgba(52, 198, 146, 0.25);
      pointer-events: none;
      z-index: 1;
      filter: blur(45px);
      mix-blend-mode: screen;
      opacity: 0.65;
    `
    document.body.appendChild(glow)

    const updateGlow = (e: MouseEvent) => {
      glow.style.left = (e.clientX - 150) + 'px'
      glow.style.top = (e.clientY - 150) + 'px'
    }

    window.addEventListener('mousemove', updateGlow)

    onUnmounted(() => {
      window.removeEventListener('mousemove', updateGlow)
      glow.remove()
    })
  })
}
