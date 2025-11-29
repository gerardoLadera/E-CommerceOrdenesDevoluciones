// src/modules/ordenes/types/enums.ts

export const EstadoDevolucion = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
} as const;

export type EstadoDevolucion = typeof EstadoDevolucion[keyof typeof EstadoDevolucion];

export const AccionItemDevolucion = {
  REEMBOLSO: 'reembolso',
  REEMPLAZO: 'reemplazo',
  REPARACION: 'reparacion',
} as const;

export type AccionItemDevolucion = typeof AccionItemDevolucion[keyof typeof AccionItemDevolucion];

export const EstadoReembolso = {
  PENDIENTE: 'pendiente',
  PROCESADO: 'procesado',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
} as const;

export type EstadoReembolso = typeof EstadoReembolso[keyof typeof EstadoReembolso];

export const TipoAjuste = {
  SIN_CARGO: 'sin_cargo',
  CARGO_ADICIONAL: 'cargo_adicional',
  CREDITO: 'credito',
} as const;

export type TipoAjuste = typeof TipoAjuste[keyof typeof TipoAjuste];

export const MetodoDevolucion = {
  ENVIO_DOMICILIO: 'envio_domicilio',
  RECOLECCION: 'recoleccion',
  PUNTO_ENTREGA: 'punto_entrega',
} as const;

export type MetodoDevolucion = typeof MetodoDevolucion[keyof typeof MetodoDevolucion];
