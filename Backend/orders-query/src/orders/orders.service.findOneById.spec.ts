import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService.findOneById', () => {
    let service: OrdersService;
    const mockCollection = { findOne: jest.fn() };
    const mongoService = {
        getCollection: jest.fn().mockReturnValue(mockCollection),
    };

    beforeEach(() => {
        service = new OrdersService(mongoService as any);
    });

    it('debe devolver la orden si existe', async () => {
        const orderMock = { _id: 'abc123', cod_orden: 'ORD-001' };
        mockCollection.findOne.mockResolvedValue(orderMock);

        const result = await service.findOneById('abc123');
        expect(result).toEqual(orderMock);
    });

    it('debe lanzar NotFoundException si la orden no existe', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        await expect(service.findOneById('no-existe'))
        .rejects
        .toThrow(NotFoundException);
    });
});