export class DevolucionNotificationDto {
  devolucionId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  estado: string;
  tipo: 'aprobada' | 'rechazada';
  motivo?: string;
  comentario?: string;
  numeroAutorizacion?: string;
  adminId?: number;
  timestamp: string;
}
