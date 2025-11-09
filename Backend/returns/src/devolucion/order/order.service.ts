import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface OrderResponse {
    id: string;
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    status: 'pending' | 'shipped' | 'delivered';
}

@Injectable()
export class OrderService {
    // --- NUEVA LÍNEA ---
    private readonly ordersApiUrl = process.env.ORDERS_API_URL || 'http://localhost:3002'; // Por defecto, apuntamos a orders-query en el puerto 3002

    constructor(private readonly httpClient: HttpService) { }

    async getOrderById(orderId: string): Promise<OrderResponse> {
        // --- LÍNEA MODIFICADA ---
        const url = `${this.ordersApiUrl}/orders/${orderId}`; 
        const response = await firstValueFrom(
            this.httpClient.get<OrderResponse>(url)
        );
        return response.data;
    }
}