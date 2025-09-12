import { Repository, EntityRepository } from 'typeorm';
import { Order } from '../entities/Order';

@EntityRepository(Order)
export class OrderRepository extends Repository<Order> {
    // Aquí puedes agregar métodos personalizados si los necesitas
    // Por ejemplo:
    async findByUserId(userId: string): Promise<Order[]> {
        return this.find({ where: { user_id: userId } });
    }
}