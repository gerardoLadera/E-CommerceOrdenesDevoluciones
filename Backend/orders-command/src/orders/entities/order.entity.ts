export class Order {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
  shippingAddress: string;
  status: 'CREATED' | 'PAID' | 'CONFIRMED' |'SHIPPED'|'DELIVERED'|'FINALIZED'|'CANCELED';
  createdAt: Date;

  constructor(partial: Partial<Order>) {
    Object.assign(this, partial);
  }
}
