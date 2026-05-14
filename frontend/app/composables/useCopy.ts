/**
 * useCopy — textos centralizados en español para toda la aplicación.
 * Evita duplicar strings de validación, roles y estados en cada página.
 */
export const useCopy = () => ({
  validation: {
    required: 'Este campo es requerido',
    email: 'Email inválido',
    minLength: (n = 6) => `Mínimo ${n} caracteres`,
    passwordMatch: 'Las contraseñas no coinciden',
  },

  roles: {
    admin: 'Super Admin',
    business: 'Negocio',
    client: 'Cliente',
  } as Record<string, string>,

  bookingStatus: {
    pending:   'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show:   'No Show',
  } as Record<string, string>,

  actions: {
    cancel:  'Cancelar',
    confirm: 'Confirmar',
    reject:  'Rechazar',
    save:    'Guardar cambios',
    retry:   'Reintentar',
    close:   'Cerrar',
    create:  'Crear',
    edit:    'Editar',
    delete:  'Eliminar',
  },

  errors: {
    generic:      'Ocurrió un error inesperado. Intenta de nuevo.',
    network:      'No pudimos cargar la información. Verifica tu conexión.',
    unauthorized: 'No tienes permiso para realizar esta acción.',
    notFound:     'El recurso solicitado no existe.',
    conflict:     'Ya existe un registro con esos datos.',
  },
})
