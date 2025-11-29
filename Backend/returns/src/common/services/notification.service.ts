import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notifServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    // URL del servicio de notificaciones
    this.notifServiceUrl = process.env.NOTIFS_SERVICE_URL || 'http://notifs:3000';
  }

  async sendDevolucionApprovalNotification(data: {
    devolucionId: string;
    orderId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    estado: string;
    numeroAutorizacion?: string;
    adminId?: number;
    comentario?: string;
  }): Promise<void> {
    try {
      const notification = {
        ...data,
        tipo: 'aprobada',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Enviando notificación de aprobación al servicio de notifs: ${this.notifServiceUrl}/notifications/devolucion`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.notifServiceUrl}/notifications/devolucion`, notification)
      );

      this.logger.log(`Notificación de aprobación enviada exitosamente: ${response.data.message}`);
    } catch (error) {
      this.logger.error(`Error al enviar notificación de aprobación: ${error.message}`, error.stack);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  async sendDevolucionRejectionNotification(data: {
    devolucionId: string;
    orderId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    estado: string;
    motivo?: string;
    comentario?: string;
    adminId?: number;
  }): Promise<void> {
    try {
      const notification = {
        ...data,
        tipo: 'rechazada',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Enviando notificación de rechazo al servicio de notifs: ${this.notifServiceUrl}/notifications/devolucion`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.notifServiceUrl}/notifications/devolucion`, notification)
      );

      this.logger.log(`Notificación de rechazo enviada exitosamente: ${response.data.message}`);
    } catch (error) {
      this.logger.error(`Error al enviar notificación de rechazo: ${error.message}`, error.stack);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
}
