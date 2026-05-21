# Catálogo de componentes — Tu Cancha

Design system dark premium. Tokens en `app/assets/main.css`. Todos los
componentes se **auto-importan** (Nuxt): se usan sin escribir el import.
Para una vista nueva, **componer** estas piezas en vez de escribir CSS por página.

## Layout / estructura

| Componente | Para qué | Props / slots |
|---|---|---|
| `AppHero` | encabezado destacado de vista | `eyebrow` `title` `subtitle`; slots `actions`, default |
| `AppSection` | bloque con encabezado | `title` `subtitle` `icon` `count`; slot `action` |
| `AppGrid` | grid responsivo | `:min` (auto-fill) o `:cols` + `:gap` |
| `AppCard` | superficie estándar | `title` `subtitle` `icon` `hover` `flush`; slots header/footer |
| `AppModalShell` | modal estándar | `v-model` `title` `subtitle` `width`; slots tag/body/footer |

## Contenido / tarjetas

| Componente | Props |
|---|---|
| `BusinessCard` | `:business` |
| `CourtCard` | `:court` `:to` |
| `BookingCard` | `:booking` `@cancel` |
| `StatCard` | `:label :value :icon :accent` |
| `BookingStatusChip` | `:status` |
| `AppMediaPlaceholder` | `type` `compact` `label` `ratio` (combina con `safeCover()`) |

## Estados

`EmptyState` (`:icon :title :description` + `#action`) · `ErrorState` (`:message` `@retry`) ·
`LoadingState` (`:count`) · `PageHeader` (`tag/title/subtitle` + `#action`).

## Imágenes

```ts
import { safeCover } from '~/composables/useImage'
const cover = computed(() => safeCover(item.images?.[0]))
```
`safeCover`: URL real → la devuelve; picsum o vacía → `''` (la card cae al
`AppMediaPlaceholder` con el logo de TuCancha).

## Clases utilitarias globales (main.css)

- Botones (en `<a>`/`<button>`): `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger`
- Superficies: `.surface-card` `.surface-card--hover` `.surface-elev`
- Formularios: `.app-form-section` · `.app-form-grid.cols-2/.cols-3` · `.app-form-hint` · `.app-form-actions`
- Horarios: `.schedule-day-card` `.schedule-slot-row` `.schedule-info-callout`

## Plantilla de vista nueva

```vue
<template>
  <div>
    <AppHero eyebrow="..." title="..." subtitle="..." />
    <AppSection title="Resultados" :count="items.length">
      <AppGrid :min="280">
        <CourtCard v-for="c in items" :key="c.id" :court="c" />
      </AppGrid>
    </AppSection>
  </div>
</template>
```
