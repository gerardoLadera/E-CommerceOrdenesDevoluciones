import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface OrderResponse {
    id: string;
    customerName: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    status: 'pending' | 'shipped' | 'delivered';
}

@Injectable()
export class OrderService {
    constructor(private readonly httpClient: HttpService) { }

    async getOrderById(orderId: string): Promise<OrderResponse> {
        const url = `http://localhost:3000/orders/${orderId}`;
        const response = await firstValueFrom(
            this.httpClient.get<OrderResponse>(url)
        );
        return response.data;
    }

}