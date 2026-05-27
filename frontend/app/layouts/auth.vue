<template>
  <v-app>
    <v-main class="auth-main">

      <!-- ─── Background layers ──────────────────────── -->
      <div class="auth-bg-layer"></div>
      <div class="auth-hero-img"></div>
      <div class="auth-overlay"></div>

      <!-- ─── Floating decorative blobs ─────────────── -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <!-- ─── Centered content ───────────────────────── -->
      <div class="auth-container">

        <!-- Brand -->
        <div class="brand-header">
          <NuxtLink to="/" aria-label="TuCancha — Inicio">
            <img src="/logo-transparent.png" alt="TuCancha" class="auth-brand-logo" />
          </NuxtLink>
        </div>

        <!-- Slot: login / register card -->
        <slot />

      </div>

    </v-main>
  </v-app>
</template>

<style scoped>
/* ─── Base ──────────────────────────────────────────── */
.auth-main {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Manrope', sans-serif;
}

/* full-page hero background image with pan/zoom animation */
.auth-hero-img {
  position: fixed;
  inset: -5%; /* Extra padding to prevent clipping during animation */
  background-image: url('/ultraresolucion.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
  animation: cinematicZoom 35s ease-in-out infinite alternate;
}

/* dark dynamic gradient overlay */
.auth-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(13, 17, 23, 0.86) 0%,
    rgba(18, 24, 31, 0.78) 50%,
    rgba(12, 16, 22, 0.9) 100%
  );
  background-size: 200% 200%;
  z-index: 1;
  animation: overlayShift 18s ease-in-out infinite alternate;
}

/* subtle dark surface layer */
.auth-bg-layer {
  position: fixed;
  inset: 0;
  background: #0f1318;
  z-index: -1;
}

/* ─── Decorative blobs ──────────────────────────────── */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 2;
}
.blob-1 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(194,65,12,0.22), transparent 70%);
  top: -80px;
  left: -100px;
  animation: float 7s ease-in-out infinite;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(22,101,52,0.18), transparent 70%);
  bottom: -60px;
  right: -60px;
  animation: float 9s ease-in-out infinite reverse;
}

/* ─── Layout container ──────────────────────────────── */
.auth-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: tc-fade-up .45s cubic-bezier(.22, 1, .36, 1) both;
}

/* ─── Brand logo ────────────────────────────────────── */
.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-brand-logo {
  height: 72px;
  width: auto;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 0 16px rgba(47, 161, 138, 0.3));
  transition: filter 0.3s, transform 0.3s;
  transform: scale(1.3);
  transform-origin: center center;
}
.auth-brand-logo:hover {
  filter: drop-shadow(0 0 24px rgba(47, 161, 138, 0.5));
}

/* ─── Animations ────────────────────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-14px); }
}
@keyframes cinematicZoom {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.06) translate(1%, 1.5%); }
}
@keyframes overlayShift {
  0% { background-position: 0% 50%; opacity: 0.95; }
  100% { background-position: 100% 50%; opacity: 1; }
}

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 520px) {
  .auth-main {
    align-items: flex-start;
    padding-top: 24px;
  }
  .auth-container {
    padding: 12px 16px;
    gap: 10px;
    max-width: 100%;
  }
  .brand-header {
    margin-bottom: -2px;
  }
  .auth-brand-logo {
    height: 56px;
    transform: scale(1.15);
  }
  /* Darker overlay on mobile for better readability */
  .auth-overlay {
    background: linear-gradient(
      135deg,
      rgba(10, 13, 18, 0.92) 0%,
      rgba(14, 18, 24, 0.88) 50%,
      rgba(8, 12, 18, 0.94) 100%
    ) !important;
  }
  /* Subtler animation on small screens */
  .auth-hero-img {
    animation-duration: 50s;
  }
  /* Smaller blobs */
  .blob-1 {
    width: 200px;
    height: 200px;
    top: -40px;
    left: -60px;
  }
  .blob-2 {
    width: 160px;
    height: 160px;
    bottom: -30px;
    right: -30px;
  }
}

/* Extra small phones */
@media (max-width: 380px) {
  .auth-container {
    padding: 8px 12px;
    gap: 8px;
  }
  .auth-brand-logo {
    height: 48px;
    transform: scale(1.1);
  }
}
</style>
