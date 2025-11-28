// Define el payload de datos del evento 'return-created'
export interface DevolutionCreatedEvent {
  /** El ID único de la devolución (UUID) */
  returnId: string;
  /** El ID de la orden a la que se aplica la devolución */
  orderId: string;
  /** Tipo de acción solicitada: REIMBURSEMENT, REPLACEMENT, o null si aún no se decide */
  type: 'REIMBURSEMENT' | 'REPLACEMENT' | null;
  /** Estado actual de la devolución (ej: PENDIENTE, PROCESANDO) */
  status: string;
  /** Marca de tiempo de la creación de la devolución */
  createdAt: Date | string;

  /** Lista de ítems devueltos/reemplazados */
  returnedItems: {
    itemId: string;
    productId: string;
    quantity: number;
    motive: string;
    purchasePrice: number;
    moneda: string;
  }[];

  /** Detalles del reembolso (si aplica) */
  reimbursementDetails?: {
    id: string;
    monto: number;
    estado: string;
    transaccion_id: string;
  };

  /** Detalles del reemplazo (si aplica) */
  replacementDetails?: {
    id: string;
    /** ID de la nueva orden generada para el reemplazo */
    ordenReemplazoId: string;
  };
}

// Interfaz para el evento completo que se envía a Kafka
// (Se recomienda usar esta estructura si tu servicio de Kafka la espera)
export interface KafkaEvent<T> {
  eventType: string;
  data: T;
  timestamp: string;
}
