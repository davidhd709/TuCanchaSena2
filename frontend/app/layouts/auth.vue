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
          <img src="/logo-transparent.png" alt="TuCancha" class="auth-brand-logo" />
        </div>

        <!-- Slot: login / register card -->
        <slot />

        <!-- Footer legal -->
        <p class="auth-footer">© {{ new Date().getFullYear() }} TuCancha · Todos los derechos reservados</p>
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
  font-family: 'Poppins', sans-serif;
}

/* full-page hero background image */
.auth-hero-img {
  position: fixed;
  inset: 0;
  background-image: url('/hero-court.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
}

/* dark gradient overlay */
.auth-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(6, 8, 16, 0.88) 0%,
    rgba(10, 20, 14, 0.82) 50%,
    rgba(6, 8, 16, 0.92) 100%
  );
  z-index: 1;
}

/* subtle dark surface layer */
.auth-bg-layer {
  position: fixed;
  inset: 0;
  background: #060810;
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
  background: radial-gradient(circle, rgba(34,197,94,0.2), transparent 70%);
  top: -80px;
  left: -100px;
  animation: float 7s ease-in-out infinite;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
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
  gap: 24px;
  animation: fadeInUp 0.55s ease forwards;
}

/* ─── Brand logo ────────────────────────────────────── */
.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-brand-logo {
  height: 90px;
  width: auto;
  object-fit: contain;
  border-radius: 12px;
  /* subtle glow matching the green logo */
  filter: drop-shadow(0 0 16px rgba(34,197,94,0.3));
  transition: filter 0.3s;
  transform: scale(1.4);
  transform-origin: center center;
}
.auth-brand-logo:hover {
  filter: drop-shadow(0 0 24px rgba(34,197,94,0.5));
}

/* ─── Footer ────────────────────────────────────────── */
.auth-footer {
  font-size: 0.72rem;
  color: #475569;
  text-align: center;
  margin-top: 4px;
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

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 520px) {
  .auth-container { padding: 16px 12px; }
}
</style>