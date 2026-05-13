<template>
  <div class="rich-editor" :class="{ 'rich-editor--focused': editor?.isFocused }">

    <!-- ── Toolbar ──────────────────────────────────────────────────────────── -->
    <div class="rich-editor-toolbar">

      <!-- Historial -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <v-tooltip text="Deshacer (Ctrl+Z)">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon size="small" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()">
              <v-icon size="18">mdi-undo</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Rehacer (Ctrl+Y)">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon size="small" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()">
              <v-icon size="18">mdi-redo</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Headings -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <v-tooltip text="Título 1">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('heading', { level: 1 }) ? 'primary' : undefined"
              :variant="editor?.isActive('heading', { level: 1 }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
              <span class="text-caption font-weight-bold">H1</span>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Título 2">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('heading', { level: 2 }) ? 'primary' : undefined"
              :variant="editor?.isActive('heading', { level: 2 }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              <span class="text-caption font-weight-bold">H2</span>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Título 3">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('heading', { level: 3 }) ? 'primary' : undefined"
              :variant="editor?.isActive('heading', { level: 3 }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
              <span class="text-caption font-weight-bold">H3</span>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Formato de texto -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <v-tooltip text="Negrita (Ctrl+B)">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('bold') ? 'primary' : undefined"
              :variant="editor?.isActive('bold') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleBold().run()"
            >
              <v-icon size="18">mdi-format-bold</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Cursiva (Ctrl+I)">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('italic') ? 'primary' : undefined"
              :variant="editor?.isActive('italic') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleItalic().run()"
            >
              <v-icon size="18">mdi-format-italic</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Subrayado (Ctrl+U)">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('underline') ? 'primary' : undefined"
              :variant="editor?.isActive('underline') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleUnderline().run()"
            >
              <v-icon size="18">mdi-format-underline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Tachado">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('strike') ? 'primary' : undefined"
              :variant="editor?.isActive('strike') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleStrike().run()"
            >
              <v-icon size="18">mdi-format-strikethrough</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Código inline">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('code') ? 'primary' : undefined"
              :variant="editor?.isActive('code') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleCode().run()"
            >
              <v-icon size="18">mdi-code-tags</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Alineación -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <v-tooltip text="Izquierda">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive({ textAlign: 'left' }) ? 'primary' : undefined"
              :variant="editor?.isActive({ textAlign: 'left' }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().setTextAlign('left').run()"
            >
              <v-icon size="18">mdi-format-align-left</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Centrado">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive({ textAlign: 'center' }) ? 'primary' : undefined"
              :variant="editor?.isActive({ textAlign: 'center' }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().setTextAlign('center').run()"
            >
              <v-icon size="18">mdi-format-align-center</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Derecha">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive({ textAlign: 'right' }) ? 'primary' : undefined"
              :variant="editor?.isActive({ textAlign: 'right' }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().setTextAlign('right').run()"
            >
              <v-icon size="18">mdi-format-align-right</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Justificado">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive({ textAlign: 'justify' }) ? 'primary' : undefined"
              :variant="editor?.isActive({ textAlign: 'justify' }) ? 'tonal' : 'text'"
              @click="editor?.chain().focus().setTextAlign('justify').run()"
            >
              <v-icon size="18">mdi-format-align-justify</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Listas -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <v-tooltip text="Lista con viñetas">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('bulletList') ? 'primary' : undefined"
              :variant="editor?.isActive('bulletList') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleBulletList().run()"
            >
              <v-icon size="18">mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Lista numerada">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('orderedList') ? 'primary' : undefined"
              :variant="editor?.isActive('orderedList') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleOrderedList().run()"
            >
              <v-icon size="18">mdi-format-list-numbered</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Cita">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('blockquote') ? 'primary' : undefined"
              :variant="editor?.isActive('blockquote') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleBlockquote().run()"
            >
              <v-icon size="18">mdi-format-quote-open</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Bloque de código">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('codeBlock') ? 'primary' : undefined"
              :variant="editor?.isActive('codeBlock') ? 'tonal' : 'text'"
              @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
              <v-icon size="18">mdi-code-braces</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Tablas e imágenes -->
      <v-btn-group density="compact" variant="text" class="toolbar-group">
        <!-- Tabla -->
        <v-menu>
          <template #activator="{ props: mp }">
            <v-tooltip text="Insertar tabla">
              <template #activator="{ props: tp }">
                <v-btn
                  v-bind="{ ...mp, ...tp }" icon size="small"
                  :color="editor?.isActive('table') ? 'primary' : undefined"
                  :variant="editor?.isActive('table') ? 'tonal' : 'text'"
                >
                  <v-icon size="18">mdi-table</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item title="Insertar tabla 3×3" prepend-icon="mdi-table-plus"
              @click="insertTable" />
            <v-divider />
            <v-list-item title="Agregar columna derecha" prepend-icon="mdi-table-column-plus-after"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().addColumnAfter().run()" />
            <v-list-item title="Agregar columna izquierda" prepend-icon="mdi-table-column-plus-before"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().addColumnBefore().run()" />
            <v-list-item title="Eliminar columna" prepend-icon="mdi-table-column-remove"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().deleteColumn().run()" />
            <v-divider />
            <v-list-item title="Agregar fila abajo" prepend-icon="mdi-table-row-plus-after"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().addRowAfter().run()" />
            <v-list-item title="Agregar fila arriba" prepend-icon="mdi-table-row-plus-before"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().addRowBefore().run()" />
            <v-list-item title="Eliminar fila" prepend-icon="mdi-table-row-remove"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().deleteRow().run()" />
            <v-divider />
            <v-list-item title="Eliminar tabla" prepend-icon="mdi-table-remove" color="error"
              :disabled="!editor?.isActive('table')"
              @click="editor?.chain().focus().deleteTable().run()" />
          </v-list>
        </v-menu>

        <!-- Imagen -->
        <v-tooltip text="Insertar imagen">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon size="small" variant="text" @click="openImageDialog">
              <v-icon size="18">mdi-image-plus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Enlace -->
        <v-tooltip text="Insertar enlace">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp" icon size="small"
              :color="editor?.isActive('link') ? 'primary' : undefined"
              :variant="editor?.isActive('link') ? 'tonal' : 'text'"
              @click="openLinkDialog"
            >
              <v-icon size="18">mdi-link</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Separador horizontal -->
        <v-tooltip text="Línea horizontal">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon size="small" variant="text"
              @click="editor?.chain().focus().setHorizontalRule().run()">
              <v-icon size="18">mdi-minus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-group>

      <v-divider vertical class="mx-1" style="height:24px;align-self:center" />

      <!-- Limpiar formato -->
      <v-tooltip text="Limpiar formato">
        <template #activator="{ props: tp }">
          <v-btn v-bind="tp" icon size="small" variant="text" color="error"
            @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()">
            <v-icon size="18">mdi-format-clear</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- ── Editor content ───────────────────────────────────────────────────── -->
    <editor-content :editor="editor" class="rich-editor-content" />

    <!-- ── Image dialog ─────────────────────────────────────────────────────── -->
    <v-dialog v-model="imageDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-2 font-weight-bold pa-4 pb-2">
          <v-icon class="mr-2">mdi-image-plus</v-icon>Insertar imagen
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <v-tabs v-model="imageTab" color="primary" density="compact" class="mb-3">
            <v-tab value="url">URL externa</v-tab>
            <v-tab value="upload">Subir archivo</v-tab>
          </v-tabs>

          <div v-if="imageTab === 'url'">
            <v-text-field
              v-model="imageUrl"
              label="URL de la imagen"
              placeholder="https://ejemplo.com/imagen.jpg"
              prepend-inner-icon="mdi-link"
              density="compact"
              hide-details
            />
          </div>
          <div v-else>
            <v-file-input
              v-model="imageFile"
              label="Seleccionar imagen"
              accept="image/*"
              prepend-icon="mdi-image"
              density="compact"
              hide-details
              @update:model-value="onImageFileSelected"
            />
            <v-img
              v-if="imagePreview"
              :src="imagePreview"
              max-height="180"
              class="mt-3 rounded-lg"
              cover
            />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="imageDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!canInsertImage" @click="insertImage">
            Insertar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Link dialog ──────────────────────────────────────────────────────── -->
    <v-dialog v-model="linkDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-2 font-weight-bold pa-4 pb-2">
          <v-icon class="mr-2">mdi-link</v-icon>Insertar enlace
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <v-text-field
            v-model="linkUrl"
            label="URL del enlace"
            placeholder="https://ejemplo.com"
            prepend-inner-icon="mdi-link"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-btn v-if="editor?.isActive('link')" variant="text" color="error"
            @click="editor?.chain().focus().unsetLink().run(); linkDialog = false">
            Quitar enlace
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="linkDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!linkUrl" @click="insertLink">
            Insertar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'

const props = defineProps<{ modelValue: string }>()
const emit  = defineEmits<{ 'update:modelValue': [value: string] }>()

// ── Editor setup ───────────────────────────────────────────────────────────
const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
    Image.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  editorProps: {
    attributes: { class: 'prose-content' },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Sync external modelValue changes (e.g. when form is reset)
watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())

// ── Table ──────────────────────────────────────────────────────────────────
const insertTable = () => {
  editor.value?.chain().focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run()
}

// ── Image dialog ───────────────────────────────────────────────────────────
const imageDialog  = ref(false)
const imageTab     = ref<'url' | 'upload'>('url')
const imageUrl     = ref('')
const imageFile    = ref<File[]>([])
const imagePreview = ref('')

const canInsertImage = computed(() =>
  imageTab.value === 'url' ? !!imageUrl.value : !!imagePreview.value
)

const openImageDialog = () => {
  imageUrl.value     = ''
  imageFile.value    = []
  imagePreview.value = ''
  imageTab.value     = 'url'
  imageDialog.value  = true
}

const onImageFileSelected = (files: File[]) => {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) { imagePreview.value = ''; return }
  const reader = new FileReader()
  reader.onload = (e) => { imagePreview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

const insertImage = () => {
  const src = imageTab.value === 'url' ? imageUrl.value : imagePreview.value
  if (!src) return
  editor.value?.chain().focus().setImage({ src }).run()
  imageDialog.value = false
}

// ── Link dialog ────────────────────────────────────────────────────────────
const linkDialog = ref(false)
const linkUrl    = ref('')

const openLinkDialog = () => {
  linkUrl.value   = editor.value?.getAttributes('link').href || ''
  linkDialog.value = true
}

const insertLink = () => {
  if (!linkUrl.value) return
  editor.value?.chain().focus().setLink({ href: linkUrl.value }).run()
  linkDialog.value = false
}
</script>

<style>
/* ── Editor wrapper ───────────────────────────────────────────────────────── */
.rich-editor {
  border: 1px solid rgba(0, 0, 0, .23);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color .2s;
}

.rich-editor--focused {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.rich-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, .1);
  background: rgba(0, 0, 0, .02);
}

.toolbar-group {
  display: flex;
  align-items: center;
}

/* ── Content area ─────────────────────────────────────────────────────────── */
.rich-editor-content .tiptap {
  min-height: 180px;
  max-height: 420px;
  overflow-y: auto;
  padding: 12px 16px;
  outline: none;
  font-size: 0.9rem;
  line-height: 1.7;
}

/* ── Prose styles ────────────────────────────────────────────────────────── */
.prose-content h1 { font-size: 1.6rem; font-weight: 700; margin: .6em 0 .3em; }
.prose-content h2 { font-size: 1.3rem; font-weight: 700; margin: .6em 0 .3em; }
.prose-content h3 { font-size: 1.1rem; font-weight: 600; margin: .5em 0 .25em; }
.prose-content p  { margin: .4em 0; }
.prose-content ul, .prose-content ol { padding-left: 1.5em; margin: .4em 0; }
.prose-content li { margin: .2em 0; }
.prose-content blockquote {
  border-left: 4px solid rgba(var(--v-theme-primary), .5);
  margin: .5em 0;
  padding: .25em .75em;
  color: rgba(0,0,0,.6);
  font-style: italic;
}
.prose-content code {
  background: rgba(0,0,0,.07);
  border-radius: 4px;
  padding: 1px 5px;
  font-family: monospace;
  font-size: .85em;
}
.prose-content pre {
  background: rgba(0,0,0,.06);
  border-radius: 6px;
  padding: .75em 1em;
  overflow-x: auto;
  margin: .5em 0;
}
.prose-content pre code { background: none; padding: 0; }
.prose-content hr { border: none; border-top: 2px solid rgba(0,0,0,.12); margin: .75em 0; }
.prose-content a  { color: rgb(var(--v-theme-primary)); text-decoration: underline; }
.prose-content img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: .5em 0;
}

/* ── Table styles ────────────────────────────────────────────────────────── */
.prose-content table {
  width: 100%;
  border-collapse: collapse;
  margin: .5em 0;
  font-size: .875rem;
}
.prose-content th, .prose-content td {
  border: 1px solid rgba(0,0,0,.18);
  padding: 6px 10px;
  text-align: left;
  min-width: 60px;
}
.prose-content th {
  background: rgba(var(--v-theme-primary), .08);
  font-weight: 600;
}
.prose-content tr:nth-child(even) td {
  background: rgba(0,0,0,.02);
}

/* ── Selected cells ──────────────────────────────────────────────────────── */
.prose-content .selectedCell::after {
  background: rgba(var(--v-theme-primary), .15);
  content: '';
  left: 0; right: 0; top: 0; bottom: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}
.prose-content td, .prose-content th { position: relative; }

/* ── Placeholder ─────────────────────────────────────────────────────────── */
.tiptap p.is-editor-empty:first-child::before {
  color: rgba(0,0,0,.38);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
