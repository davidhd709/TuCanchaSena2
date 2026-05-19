<template>
  <div class="home-page">

    <!-- ═══════════════════════════════════════════════
         NAVBAR
    ════════════════════════════════════════════════ -->
    <nav class="navbar" :class="{ 'navbar--scrolled': scrolled }">
      <div class="nav-inner">
        <!-- Brand -->
        <NuxtLink to="/" class="nav-brand">
          <img src="/logo-lateral.png" alt="TuCancha" class="nav-logo-img" />
        </NuxtLink>

        <!-- Links -->
        <div class="nav-links" :class="{ 'nav-links--open': menuOpen }">
          <a href="#canchas" class="nav-link" @click="menuOpen = false">Canchas</a>
          <a href="#como-funciona" class="nav-link" @click="menuOpen = false">¿Cómo funciona?</a>
          <a href="#beneficios" class="nav-link" @click="menuOpen = false">Beneficios</a>
          <NuxtLink to="/auth/login" class="nav-cta" id="nav-login" @click="menuOpen = false">
            Iniciar sesión
          </NuxtLink>
        </div>

        <!-- Mobile hamburger -->
        <button class="hamburger" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen" aria-label="Menú">
          <span :class="`mdi ${menuOpen ? 'mdi-close' : 'mdi-menu'}`"></span>
        </button>
      </div>
    </nav>

    <!-- ═══════════════════════════════════════════════
         HERO SECTION
    ════════════════════════════════════════════════ -->
    <section class="hero" id="inicio">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>

      <!-- Decorative blobs -->
      <div class="hero-blob hero-blob-1"></div>
      <div class="hero-blob hero-blob-2"></div>

      <!-- Grid lines decoration -->
      <div class="hero-grid"></div>

      <div class="hero-content">
        <div class="hero-text animate-up" style="animation-delay: 0.1s">
          <span class="hero-badge">
            <span class="mdi mdi-soccer"></span>
            Plataforma #1 de canchas sintéticas
          </span>
          <h1 class="hero-title">
            Reserva tu cancha y<br>
            <span class="hero-title-accent">juega como un profesional!</span>
          </h1>
          <p class="hero-subtitle">
            Encuentra las mejores canchas sintéticas cerca de ti.
            Reserva en segundos, juega sin complicaciones.
          </p>
          <div class="hero-actions">
            <NuxtLink to="/auth/register" class="btn-hero-primary" id="hero-cta-register">
              <span class="mdi mdi-calendar-check"></span>
              Reservar ahora
            </NuxtLink>
            <a href="#como-funciona" class="btn-hero-secondary" id="hero-cta-how">
              <span class="mdi mdi-play-circle-outline"></span>
              ¿Cómo funciona?
            </a>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="hero-stats animate-up" style="animation-delay: 0.35s">
          <div class="stat-item">
            <span class="stat-value">+200</span>
            <span class="stat-label">Canchas disponibles</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">+5K</span>
            <span class="stat-label">Reservas realizadas</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">4.9★</span>
            <span class="stat-label">Calificación promedio</span>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="scroll-indicator">
        <span class="mdi mdi-chevron-double-down"></span>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         CANCHAS SECTION
    ════════════════════════════════════════════════ -->
    <section class="section canchas-section" id="canchas">
      <div class="container">
        <div class="section-header">
          <span class="label-tag">Nuestras canchas!!!</span>
          <h2 class="section-heading">Canchas de primera calidad!!<br><span class="text-green">listas para jugar</span></h2>
          <p class="section-desc">Instalaciones modernas con césped sintético de alto rendimiento, iluminación LED y vestuarios completos.</p>
        </div>

        <!-- Cargando -->
        <div v-if="courtsLoading" class="courts-loading">
          <span class="mdi mdi-loading mdi-spin"></span>
          Cargando canchas...
        </div>

        <!-- Grid de canchas reales -->
        <div v-else-if="courts.length > 0" class="courts-grid">
          <div
            v-for="(court, i) in courts"
            :key="court.id"
            class="court-card"
            :style="`animation-delay: ${i * 0.12}s`"
          >
            <div class="court-img-wrap">
              <div class="court-img-placeholder">
                <span class="mdi mdi-soccer-field"></span>
              </div>
              <div class="court-img-overlay"></div>
              <span class="court-badge">
                {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
              </span>
            </div>
            <div class="court-info">
              <div class="court-meta">
                <span class="mdi mdi-map-marker-outline court-loc-icon"></span>
                <span class="court-location">{{ court.business.name }}</span>
              </div>
              <h3 class="court-name">{{ court.name }}</h3>
              <div class="court-tags">
                <span class="court-tag">{{ courtTypeLabel(court.type) }}</span>
                <span class="court-tag">{{ court.capacity }} jugadores</span>
              </div>
              <div class="court-footer">
                <div class="court-price">
                  <span class="price-amount">${{ Number(court.pricePerHour).toLocaleString('es-CO') }}</span>
                  <span class="price-unit">/hora</span>
                </div>
                <NuxtLink to="/auth/login" class="court-btn" :id="`court-reserve-${i}`">
                  Reservar
                  <span class="mdi mdi-arrow-right"></span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Sin canchas -->
        <div v-else class="courts-empty">
          <span class="mdi mdi-soccer-field"></span>
          <p>Pronto publicaremos canchas disponibles. ¡Vuelve pronto!</p>
        </div>

        <div class="courts-cta">
          <NuxtLink to="/auth/register" class="btn-outline-green" id="see-all-courts">
            <span class="mdi mdi-soccer-field"></span>
            Ver todas las canchas
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         CÓMO FUNCIONA
    ════════════════════════════════════════════════ -->
    <section class="section how-section" id="como-funciona">
      <div class="container">
        <div class="section-header">
          <span class="label-tag">Simple y rápido</span>
          <h2 class="section-heading">¿Cómo funciona?</h2>
          <p class="section-desc">En 3 pasos tienes tu cancha reservada y lista para el partido.</p>
        </div>

        <div class="steps-grid">
          <div v-for="(step, i) in steps" :key="step.title" class="step-card" :style="`animation-delay: ${i*0.15}s`">
            <div class="step-number">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-icon-wrap">
              <span :class="`mdi ${step.icon} step-icon`"></span>
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         BENEFICIOS / FEATURES
    ════════════════════════════════════════════════ -->
    <section class="section benefits-section" id="beneficios">
      <div class="container">
        <div class="benefits-inner">
          <div class="benefits-text">
            <span class="label-tag">¿Por qué elegirnos a nosotros?</span>
            <h2 class="section-heading">La mejor experiencia<br>en <span class="text-green">reservas deportivas</span></h2>
            <p class="section-desc">
              Diseñado pensando en jugadores y propietarios.
              Todo lo que necesitas en un solo lugar.
            </p>
            <ul class="benefits-list">
              <li v-for="b in benefits" :key="b.text" class="benefit-item">
                <span class="benefit-check mdi mdi-check-circle"></span>
                <span>{{ b.text }}</span>
              </li>
            </ul>
            <NuxtLink to="/auth/register" class="btn-green-solid mt-8" id="benefits-cta">
              <span class="mdi mdi-rocket-launch-outline"></span>
              Empezar gratis
            </NuxtLink>
          </div>

          <div class="benefits-visual">
            <div class="features-grid">
              <div v-for="(feat, i) in features" :key="feat.title" class="feat-card" :style="`animation-delay: ${i*0.1}s`">
                <div class="feat-icon-wrap" :style="`background: ${feat.color}`">
                  <span :class="`mdi ${feat.icon} feat-icon`"></span>
                </div>
                <h4 class="feat-title">{{ feat.title }}</h4>
                <p class="feat-desc">{{ feat.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         CTA FINAL
    ════════════════════════════════════════════════ -->
    <section class="cta-section">
      <div class="cta-bg"></div>
      <div class="cta-overlay"></div>
      <div class="container cta-content">
        <span class="mdi mdi-soccer cta-icon"></span>
        <h2 class="cta-title">¿Listo para el partido?</h2>
        <p class="cta-subtitle">Únete a miles de jugadores que ya reservan con TuCancha</p>
        <div class="cta-actions">
          <NuxtLink to="/auth/register" class="btn-cta-primary" id="final-cta-register">
            <span class="mdi mdi-account-plus-outline"></span>
            Crear cuenta gratis
          </NuxtLink>
          <NuxtLink to="/auth/login" class="btn-cta-secondary" id="final-cta-login">
            Iniciar sesión
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         FOOTER
    ════════════════════════════════════════════════ -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <NuxtLink to="/" aria-label="TuCancha — Inicio">
            <img src="/logo-2.png" alt="TuCancha" class="footer-logo-img" />
          </NuxtLink>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} TuCancha · Pasión por el fútbol · Todos los derechos reservados</p>
        <div class="footer-links">
          <a href="#" class="footer-link">Privacidad</a>
          <a href="#" class="footer-link">Términos</a>
          <a href="#" class="footer-link">Contacto</a>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
// ─── Keep existing auth redirect logic untouched ───
const authStore = useAuthStore()
authStore.hydrate()
if (authStore.isAuthenticated) {
  navigateTo('/dashboard')
}

// ─── Navbar scroll effect ──────────────────────────
const scrolled = ref(false)
const menuOpen = ref(false)

// ─── Canchas reales desde el backend ───────────────
const { apiList } = useApi()
type HomeCourt = {
  id: string
  name: string
  type: string
  capacity: number
  status: string
  pricePerHour: number
  business: { name: string }
}

const courts = ref<HomeCourt[]>([])
const courtsLoading = ref(true)

const COURT_TYPES: Record<string, string> = {
  football_5: 'Fútbol 5',
  football_7: 'Fútbol 7',
  football_8: 'Fútbol 8',
  football_11: 'Fútbol 11',
  futsal: 'Futsal',
  beach_soccer: 'Fútbol Playa',
  mini_football: 'Mini Fútbol',
}
const courtTypeLabel = (type: string) => COURT_TYPES[type] ?? type

onMounted(async () => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 60
  })
  try {
    // Solo canchas reales de BD, activas/disponibles y con datos mínimos válidos.
    const dbCourts = await apiList<any>('/courts')
    courts.value = dbCourts
      .filter((c: any) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        typeof c.business?.name === 'string' &&
        Number.isFinite(Number(c.pricePerHour)) &&
        c.status === 'available',
      )
      .slice(0, 6)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        capacity: Number(c.capacity ?? 0),
        status: c.status,
        pricePerHour: Number(c.pricePerHour),
        business: { name: c.business.name },
      }))
  } catch {
    courts.value = []
  } finally {
    courtsLoading.value = false
  }
})

// ─── Steps ─────────────────────────────────────────
const steps = [
  {
    icon: 'mdi-magnify',
    title: 'Explora canchas',
    desc: 'Busca entre cientos de canchas sintéticas disponibles en tu ciudad.',
  },
  {
    icon: 'mdi-calendar-check',
    title: 'Elige tu horario',
    desc: 'Selecciona la fecha y hora que mejor se adapte a tu grupo.',
  },
  {
    icon: 'mdi-whistle',
    title: '¡A jugar!',
    desc: 'Recibe tu confirmación al instante y preséntate listo para el partido.',
  },
]

// ─── Benefits ──────────────────────────────────────
const benefits = [
  { text: 'Reserva en menos de 2 minutos' },
  { text: 'Confirmación instantánea por email' },
  { text: 'Cancela hasta 2 horas antes sin cargo' },
  { text: 'Pagos seguros y múltiples métodos' },
  { text: 'Soporte 24/7 para jugadores' },
]

// ─── Feature cards ─────────────────────────────────
const features = [
  {
    icon: 'mdi-lightning-bolt',
    title: 'Reserva rápida',
    desc: 'En segundos, sin llamadas ni espera.',
    color: 'rgba(250,204,21,0.12)',
  },
  {
    icon: 'mdi-map-marker-radius',
    title: 'Cerca de ti',
    desc: 'Canchas en todo el país, geolocalización incluida.',
    color: 'rgba(47, 161, 138, 0.12)',
  },
  {
    icon: 'mdi-shield-check',
    title: '100% seguro',
    desc: 'Pagos cifrados y datos protegidos.',
    color: 'rgba(59,130,246,0.12)',
  },
  {
    icon: 'mdi-star',
    title: 'Top calidad',
    desc: 'Solo canchas verificadas y calificadas.',
    color: 'rgba(168,85,247,0.12)',
  },
]
</script>

<style scoped>
/* ═══════════════════════════════════════════
   BASE & RESET
════════════════════════════════════════════ */
.home-page {
  font-family: 'Manrope', sans-serif;
  background: var(--bg-app);
  color: var(--text-primary);
  overflow-x: hidden;
}

.container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ═══════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════ */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 18px 0;
  transition: all 0.3s ease;
}
.navbar--scrolled {
  background: rgba(6, 8, 16, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 30px rgba(0,0,0,0.35);
}

.nav-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
}
.nav-logo-img {
  height: 56px;
  width: auto;
  border-radius: 8px;
  object-fit: contain;
  transition: opacity 0.2s;
  transform: scale(1.4);
  transform-origin: left center;
}
.nav-logo-img:hover { opacity: 0.85; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-link:hover { color: #166534; }

.nav-cta {
  padding: 9px 22px;
  background: linear-gradient(135deg, #166534, #14532d);
  color: var(--white);
  text-decoration: none;
  border-radius: 10px;
  font-size: 0.87rem;
  font-weight: 600;
  transition: all 0.25s;
  box-shadow: 0 4px 14px rgba(22,101,52,0.24);
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,101,52,0.3); filter: brightness(1.08); }

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--white);
  font-size: 1.5rem;
  cursor: pointer;
}

/* ═══════════════════════════════════════════
   HERO
════════════════════════════════════════════ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 80px 24px 40px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image: url('/hero-court.png');
  background-size: cover;
  background-position: center 30%;
  z-index: 0;
  transform: scale(1.04);
  transition: transform 8s ease;
}
.hero:hover .hero-bg { transform: scale(1); }

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(7,10,14,0.78) 0%,
    rgba(10,13,18,0.62) 40%,
    rgba(9,12,17,0.88) 80%,
    rgba(8,11,16,0.98) 100%
  );
  z-index: 1;
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 2;
}
.hero-blob-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(47, 161, 138, 0.18), transparent 65%);
  top: 10%; left: -120px;
  animation: float 8s ease-in-out infinite;
}
.hero-blob-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 65%);
  bottom: 10%; right: -80px;
  animation: float 10s ease-in-out infinite reverse;
}

.hero-grid {
  position: absolute;
  inset: 0;
  z-index: 2;
  background-image:
    linear-gradient(rgba(47, 161, 138, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 161, 138, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.35) 70%, transparent);
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 780px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

.hero-text { display: flex; flex-direction: column; align-items: center; gap: 22px; }

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(47, 161, 138, 0.12);
  border: 1px solid rgba(47, 161, 138, 0.28);
  border-radius: 100px;
  color: #4ade80;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.hero-title {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: clamp(2.2rem, 5.5vw, 3.8rem);
  font-weight: 900;
  line-height: 1.1;
  color: var(--white);
  letter-spacing: -1px;
}
.hero-title-accent {
  background: linear-gradient(135deg, #166534 0%, #86efac 50%, #facc15 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 520px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 36px;
  background: linear-gradient(135deg, #166534, #14532d);
  color: var(--white);
  text-decoration: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  transition: all 0.25s;
  box-shadow: 0 6px 28px rgba(47, 161, 138, 0.35);
  letter-spacing: 0.2px;
}
.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(47, 161, 138, 0.5);
  filter: brightness(1.1);
}

.btn-hero-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 32px;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  color: var(--white);
  text-decoration: none;
  border: 1.5px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  font-size: 0.97rem;
  font-weight: 600;
  transition: all 0.25s;
}
.btn-hero-secondary:hover {
  background: rgba(255,255,255,0.11);
  border-color: rgba(47, 161, 138, 0.5);
  color: #4ade80;
  transform: translateY(-2px);
}

/* Stats */
.hero-stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px 36px;
}
.stat-item { text-align: center; padding: 0 24px; }
.stat-value { display: block; font-size: 1.65rem; font-weight: 800; color: #166534; line-height: 1; }
.stat-label { font-size: 0.75rem; color: #64748b; margin-top: 4px; display: block; }
.stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  color: rgba(255,255,255,0.35);
  font-size: 1.4rem;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

/* Fade-up entry animation */
.animate-up {
  opacity: 0;
  animation: fadeInUp 0.7s ease forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-16px); }
}

/* ═══════════════════════════════════════════
   SECTIONS COMMON
════════════════════════════════════════════ */
.section { padding: 100px 0; }
.section-header { text-align: center; margin-bottom: 64px; }
.label-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #166534;
  margin-bottom: 14px;
}
.section-heading {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 14px;
  letter-spacing: -0.5px;
}
.text-green { color: #166534; }
.section-desc { color: #64748b; font-size: 0.97rem; line-height: 1.7; max-width: 520px; margin: 0 auto; }

/* ═══════════════════════════════════════════
   CANCHAS SECTION
════════════════════════════════════════════ */
.canchas-section { background: var(--bg-app); }

.courts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.court-card {
  background: #0f1420;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}
.court-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(47, 161, 138, 0.2);
  border-color: rgba(47, 161, 138, 0.2);
}

.court-img-wrap { position: relative; height: 200px; overflow: hidden; }
.court-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 35% 30%, rgba(47, 161, 138, 0.22), transparent 55%),
    linear-gradient(135deg, #1e2b35, #0f141c);
  transition: transform 0.5s ease;
}
.court-card:hover .court-img-placeholder { transform: scale(1.06); }
.court-img-placeholder .mdi { font-size: 3.6rem; color: rgba(47, 161, 138, 0.5); }
.court-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15,20,32,0.85) 0%, transparent 60%);
}

.courts-loading {
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
  padding: 48px 0;
}
.courts-loading .mdi { font-size: 1.3rem; color: #166534; vertical-align: -2px; }

.courts-empty {
  text-align: center;
  color: #64748b;
  padding: 56px 24px;
}
.courts-empty .mdi {
  font-size: 3rem;
  color: rgba(22,101,52,0.3);
  display: block;
  margin-bottom: 12px;
}
.courts-empty p { font-size: 0.92rem; }
.court-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(47, 161, 138, 0.9);
  color: var(--white);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 100px;
  backdrop-filter: blur(6px);
  letter-spacing: 0.3px;
}

.court-info { padding: 20px; }
.court-meta { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
.court-loc-icon { font-size: 0.85rem; color: #166534; }
.court-location { font-size: 0.77rem; color: #64748b; }
.court-name { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.court-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.court-tag {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 3px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 100px;
  color: var(--text-muted);
}

.court-footer { display: flex; align-items: center; justify-content: space-between; }
.court-price { display: flex; align-items: baseline; gap: 3px; }
.price-amount { font-size: 1.1rem; font-weight: 800; color: #166534; }
.price-unit { font-size: 0.75rem; color: #64748b; }

.court-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #166534, #14532d);
  color: var(--white);
  text-decoration: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.25s;
}
.court-btn:hover { transform: translateY(-1px); filter: brightness(1.1); box-shadow: 0 6px 18px rgba(47, 161, 138, 0.35); }

.courts-cta { text-align: center; margin-top: 48px; }
.btn-outline-green {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border: 2px solid rgba(22,101,52,0.3);
  color: #166534;
  text-decoration: none;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 600;
  transition: all 0.25s;
}
.btn-outline-green:hover { background: rgba(47, 161, 138, 0.1); border-color: #166534; transform: translateY(-2px); }

/* ═══════════════════════════════════════════
   HOW IT WORKS
════════════════════════════════════════════ */
.how-section {
  background: linear-gradient(180deg, #111720 0%, #0a1118 50%, #121922 100%);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  position: relative;
}

/* connecting line between steps */
.steps-grid::before {
  content: '';
  position: absolute;
  top: 56px;
  left: calc(16.66% + 24px);
  right: calc(16.66% + 24px);
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(22,101,52,0.24), transparent);
  z-index: 0;
}

.step-card {
  position: relative;
  z-index: 1;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 36px 28px 28px;
  text-align: center;
  transition: all 0.3s;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}
.step-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(47, 161, 138, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
}

.step-number {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(22,101,52,0.3);
  letter-spacing: 2px;
  margin-bottom: 16px;
  font-family: 'Sora', sans-serif;
}

.step-icon-wrap {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(47, 161, 138, 0.15), rgba(47, 161, 138, 0.08));
  border: 1px solid rgba(47, 161, 138, 0.2);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  transition: all 0.3s;
}
.step-card:hover .step-icon-wrap {
  background: linear-gradient(135deg, rgba(47, 161, 138, 0.25), rgba(47, 161, 138, 0.08));
  box-shadow: 0 0 24px rgba(47, 161, 138, 0.2);
}
.step-icon { font-size: 1.8rem; color: #166534; }

.step-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.step-desc { font-size: 0.87rem; color: #64748b; line-height: 1.65; }

/* ═══════════════════════════════════════════
   BENEFITS
════════════════════════════════════════════ */
.benefits-section { background: var(--bg-app); }

.benefits-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.benefits-text .label-tag,
.benefits-text .section-heading,
.benefits-text .section-desc {
  text-align: left;
  margin: 0 0 16px;
}
.benefits-text .section-desc { margin-bottom: 28px; max-width: none; }

.benefits-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.benefit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.benefit-check { color: #166534; font-size: 1.1rem; flex-shrink: 0; }

.btn-green-solid {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 30px;
  background: linear-gradient(135deg, #166534, #14532d);
  color: var(--white);
  text-decoration: none;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 700;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(47, 161, 138, 0.28);
  margin-top: 32px;
}
.btn-green-solid:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(47, 161, 138, 0.42); filter: brightness(1.08); }

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  padding: 24px;
  transition: all 0.3s;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}
.feat-card:hover {
  border-color: rgba(47, 161, 138, 0.18);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.3);
}

.feat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.feat-icon { font-size: 1.4rem; color: #166534; }
.feat-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.feat-desc { font-size: 0.78rem; color: #64748b; line-height: 1.55; }

/* ═══════════════════════════════════════════
   CTA SECTION
════════════════════════════════════════════ */
.cta-section {
  position: relative;
  padding: 100px 24px;
  text-align: center;
  overflow: hidden;
}
.cta-bg {
  position: absolute;
  inset: 0;
  background-image: url('/hero-court.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
  filter: brightness(0.4) saturate(0.7);
}
.cta-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6,8,16,0.82), rgba(10,25,16,0.78));
  z-index: 1;
}
.cta-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.cta-icon { font-size: 3rem; color: #166534; margin-bottom: 4px; }
.cta-title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 900;
  color: var(--white);
  letter-spacing: -1px;
}
.cta-subtitle { color: var(--text-muted); font-size: 1rem; }
.cta-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

.btn-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 34px;
  background: linear-gradient(135deg, #166534, #14532d);
  color: var(--white);
  text-decoration: none;
  border-radius: 13px;
  font-size: 0.97rem;
  font-weight: 700;
  transition: all 0.25s;
  box-shadow: 0 6px 24px rgba(47, 161, 138, 0.35);
}
.btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(47, 161, 138, 0.5); filter: brightness(1.08); }

.btn-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 30px;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(10px);
  color: var(--white);
  text-decoration: none;
  border: 1.5px solid rgba(255,255,255,0.2);
  border-radius: 13px;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.25s;
}
.btn-cta-secondary:hover { border-color: rgba(47, 161, 138, 0.5); color: #4ade80; transform: translateY(-2px); }

/* ═══════════════════════════════════════════
   FOOTER
════════════════════════════════════════════ */
.footer {
  background: #040609;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 28px 0;
}
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.footer-brand { display: flex; align-items: center; }
.footer-logo-img {
  height: 40px;
  width: auto;
  border-radius: 6px;
  object-fit: contain;
  opacity: 0.85;
  transform: scale(1.4);
  transform-origin: left center;
}
.footer-copy { font-size: 0.75rem; color: #334155; flex: 1; text-align: center; }
.footer-links { display: flex; gap: 20px; }
.footer-link { font-size: 0.75rem; color: #334155; text-decoration: none; transition: color 0.2s; }
.footer-link:hover { color: #166534; }

/* ═══════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════════ */
@media (max-width: 900px) {
  .courts-grid,
  .steps-grid { grid-template-columns: 1fr; }
  .steps-grid::before { display: none; }
  .benefits-inner { grid-template-columns: 1fr; gap: 48px; }
  .features-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 680px) {
  .nav-links {
    display: none;
    position: fixed;
    inset: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(6,8,16,0.97);
    backdrop-filter: blur(20px);
    z-index: 200;
    gap: 28px;
    font-size: 1.1rem;
  }
  .nav-links--open { display: flex; }
  .hamburger { display: flex; z-index: 210; }

  /* Hero más compacto en móvil para que el CTA "Reservar ahora" quede sobre el pliegue. */
  .hero {
    min-height: auto;
    padding: 90px 20px 32px;
  }
  .hero-content { gap: 28px; max-width: 100%; }
  .hero-text { gap: 14px; }
  .hero-title { font-size: clamp(1.7rem, 7vw, 2.3rem); line-height: 1.15; }
  .hero-subtitle { font-size: .95rem; line-height: 1.5; }
  .hero-badge { font-size: .72rem; padding: 4px 12px; }

  /* Stats compactos en fila — más abajo del CTA, con divisores horizontales. */
  .hero-stats {
    flex-direction: row;
    justify-content: space-around;
    gap: 8px;
    padding: 14px 12px;
  }
  .stat-divider { width: 1px; height: 28px; }
  .stat-value { font-size: 1.1rem; }
  .stat-label { font-size: .7rem; }

  .features-grid { grid-template-columns: 1fr; }
  .footer-inner { flex-direction: column; text-align: center; }
  .footer-copy { order: 2; }
}

@media (max-width: 480px) {
  .courts-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; width: 100%; }
  .btn-hero-primary,
  .btn-hero-secondary { width: 100%; justify-content: center; }
}

@media (max-width: 390px) {
  .hero { padding: 80px 16px 24px; }
  .hero-title { font-size: 1.55rem; }
  .hero-subtitle { font-size: .88rem; }
}
</style>
