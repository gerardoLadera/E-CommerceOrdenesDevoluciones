import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { InventoryService } from './inventory.service';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepository: Repository<OrderHistory>,

    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validar stock
    const stockResult = await this.inventoryService.reserveStock(
      createOrderDto.items.map(i => ({ sku: i.productId, quantity: i.quantity }))
    );
     if (stockResult.status === 'NO_STOCK') {
      throw new ConflictException(`No hay stock disponible para SKU: ${stockResult.sku}`);
    }
    // Crear orden
    const order = this.orderRepository.create({
      id: uuidv4(),
      user_id: createOrderDto.customerId,
      status: 'CREATED',
      total_amount: 0,
      currency: 'USD',
      shipping_address: createOrderDto.shippingAddress,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.orderRepository.save(order);

    // Crear items
    const items = createOrderDto.items.map((i) =>
      this.orderItemRepository.create({
        order_id: order.id,
        sku_id: i.productId,
        quantity: i.quantity,
        unit_price: 0,
        total_price: 0,
      }),
    );

    await this.orderItemRepository.save(items);

    // Guardar historial de creación
    const history = this.orderHistoryRepository.create({
        order_id: order.id,
        previous_status: null,
        new_status: 'CREATED',
        changed_at: new Date(),
    });

    await this.orderHistoryRepository.save(history);
    
    console.log('Evento OrderCreated', { orderId: order.id, userId: order.user_id });
    // Retornar la orden con sus items
    return { ...order, order_items: items };
  }
}
