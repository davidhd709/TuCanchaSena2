<template>
  <div>
    <h3 class="text-subtitle-2 font-weight-bold mb-3">
      <v-icon size="18" class="mr-1" color="primary">mdi-file-upload-outline</v-icon>
      Comprobante de Pago
    </h3>

    <!-- Zona de drop / file input -->
    <div
      class="upload-zone rounded-lg pa-5 text-center mb-3"
      :class="{
        'upload-zone--active': isDragging,
        'upload-zone--uploaded': uploadState === 'uploaded',
        'upload-zone--error': uploadState === 'error',
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <!-- Ícono de estado -->
      <transition name="fade" mode="out-in">
        <v-icon
          v-if="uploadState === 'idle'"
          key="idle"
          size="48"
          color="primary"
          class="mb-2 d-block mx-auto"
        >mdi-cloud-upload-outline</v-icon>

        <v-icon
          v-else-if="uploadState === 'uploading'"
          key="uploading"
          size="48"
          color="primary"
          class="mb-2 d-block mx-auto upload-spin"
        >mdi-loading</v-icon>

        <v-icon
          v-else-if="uploadState === 'uploaded' && isPdf"
          key="pdf"
          size="48"
          color="success"
          class="mb-2 d-block mx-auto"
        >mdi-file-pdf-box</v-icon>

        <v-icon
          v-else-if="uploadState === 'error'"
          key="error"
          size="48"
          color="error"
          class="mb-2 d-block mx-auto"
        >mdi-file-alert-outline</v-icon>
      </transition>

      <!-- Preview imagen -->
      <div v-if="uploadState === 'uploaded' && previewUrl && !isPdf" class="mb-3">
        <v-img
          :src="previewUrl"
          max-height="160"
          cover
          rounded="lg"
          class="mx-auto"
          style="max-width: 300px"
        />
      </div>

      <!-- Texto de estado -->
      <div class="text-body-2 font-weight-medium mb-1">
        <span v-if="uploadState === 'idle'">Arrastra tu comprobante aquí</span>
        <span v-else-if="uploadState === 'uploading'" class="text-primary">Procesando...</span>
        <span v-else-if="uploadState === 'uploaded'" class="text-success">
          {{ currentFile?.name }}
        </span>
        <span v-else-if="uploadState === 'error'" class="text-error">
          Archivo no válido
        </span>
      </div>

      <div v-if="uploadState === 'idle'" class="text-caption text-medium-emphasis mb-3">
        o haz clic para seleccionar · PNG, JPG, PDF · máx. 5 MB
      </div>
      <div v-if="uploadState === 'uploaded'" class="text-caption text-medium-emphasis mb-3">
        {{ fileSizeLabel }} · Haz clic en "Cambiar" para reemplazar
      </div>

      <!-- Botones acción -->
      <div class="d-flex gap-2 justify-center flex-wrap">
        <v-btn
          v-if="uploadState === 'idle' || uploadState === 'error'"
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-folder-open-outline"
          @click="triggerFileInput"
        >
          Seleccionar archivo
        </v-btn>

        <v-btn
          v-if="uploadState === 'uploaded'"
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-swap-horizontal"
          @click="triggerFileInput"
        >
          Cambiar
        </v-btn>

        <v-btn
          v-if="uploadState === 'uploaded'"
          color="error"
          variant="text"
          size="small"
          prepend-icon="mdi-delete-outline"
          @click="clearFile"
        >
          Quitar
        </v-btn>
      </div>
    </div>

    <!-- Error message -->
    <v-alert
      v-if="errorMsg"
      type="error"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mb-3"
      closable
      @click:close="errorMsg = ''"
    >
      {{ errorMsg }}
    </v-alert>

    <!-- Input oculto -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/jpg,application/pdf"
      style="display: none"
      data-testid="payment-proof-input"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * BookingPaymentUpload
 * Componente de subida de comprobante de pago con validación de MIME y tamaño.
 *
 * Emite:
 *   - update:modelValue (File | null): el archivo válido seleccionado
 *   - upload-state ('idle' | 'uploading' | 'uploaded' | 'error'): estado actual
 */

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error'

const props = defineProps<{
  modelValue?: File | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', file: File | null): void
  (e: 'upload-state', state: UploadState): void
}>()

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadState = ref<UploadState>('idle')
const currentFile = ref<File | null>(props.modelValue ?? null)
const previewUrl = ref<string | null>(null)
const errorMsg = ref('')
const isDragging = ref(false)

const isPdf = computed(() => currentFile.value?.type === 'application/pdf')

const fileSizeLabel = computed(() => {
  if (!currentFile.value) return ''
  const kb = currentFile.value.size / 1024
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
})

// —— Métodos ——

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const validate = (file: File): string | null => {
  if (!ALLOWED_MIMES.includes(file.type)) {
    return 'Solo se permiten archivos PNG, JPG o PDF.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'El archivo no debe superar los 5 MB.'
  }
  return null
}

const processFile = async (file: File) => {
  uploadState.value = 'uploading'
  emit('upload-state', 'uploading')

  const validationError = validate(file)
  if (validationError) {
    errorMsg.value = validationError
    uploadState.value = 'error'
    emit('upload-state', 'error')
    emit('update:modelValue', null)
    currentFile.value = null
    previewUrl.value = null
    return
  }

  currentFile.value = file
  errorMsg.value = ''

  // Generar preview para imágenes
  if (file.type !== 'application/pdf') {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }

  uploadState.value = 'uploaded'
  emit('upload-state', 'uploaded')
  emit('update:modelValue', file)
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
  // Reset para permitir re-seleccionar el mismo archivo
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const onDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const clearFile = () => {
  currentFile.value = null
  previewUrl.value = null
  uploadState.value = 'idle'
  errorMsg.value = ''
  emit('update:modelValue', null)
  emit('upload-state', 'idle')
}

// Limpiar URL de objeto al desmontar para evitar memory leaks
onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// Sincronizar si el padre limpia el modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (!val && uploadState.value === 'uploaded') clearFile()
  },
)
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
  transition: all 0.2s ease;
  cursor: pointer;
}
.upload-zone:hover {
  border-color: rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-primary), 0.06);
}
.upload-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.01);
}
.upload-zone--uploaded {
  border-color: rgba(var(--v-theme-success), 0.6);
  background: rgba(var(--v-theme-success), 0.04);
}
.upload-zone--error {
  border-color: rgba(var(--v-theme-error), 0.6);
  background: rgba(var(--v-theme-error), 0.04);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.upload-spin {
  animation: spin 1s linear infinite;
}
</style>
