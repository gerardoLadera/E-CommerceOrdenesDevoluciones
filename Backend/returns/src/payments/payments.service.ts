import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface RefundRequestDto {
  orden_id: string;
  monto: number;
  motivo?: string;
}

// Interfaz para la respuesta del mock de pagos
export interface RefundResponseDto {
  status: string;
  reembolso_id: string;
  fecha_reembolso: Date;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paymentsApiUrl = process.env.PAYMENTS_API_URL;

  constructor(private readonly httpService: HttpService) {}

  async processRefund(refundData: RefundRequestDto): Promise<RefundResponseDto | null> {
    if (!this.paymentsApiUrl) {
      this.logger.error('La variable de entorno PAYMENTS_API_URL no está definida.');
      return null;
    }
    
    const url = `${this.paymentsApiUrl}/payments/refund`;
    this.logger.log(`Iniciando reembolso para la orden ${refundData.orden_id} -> ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<RefundResponseDto>(url, refundData),
      );

      if (response.status === 201) {
        this.logger.log(`Reembolso procesado. Transacción ID: ${response.data.reembolso_id}`);
        return response.data; // Devolvemos todo el objeto de respuesta
      }

      this.logger.warn(`El mock de pagos devolvió un estado inesperado: ${response.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error de comunicación con payment-mock para la orden ${refundData.orden_id}`, error.stack);
      return null;
    }
  }
}