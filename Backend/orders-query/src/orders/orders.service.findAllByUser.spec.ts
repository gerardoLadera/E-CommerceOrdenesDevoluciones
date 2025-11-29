import { OrdersService } from './orders.service';


describe('OrdersService.findAllByUser', () => {
    let service: OrdersService;
    const mockCollection = {
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mongoService = {
        getCollection: jest.fn().mockReturnValue(mockCollection),
    };

    beforeEach(() => {
        service = new OrdersService(mongoService as any);
    });

    it('debe devolver lista mapeada y paginada por usuario', async () => {
        const fakeDocs = [{
        _id: 'abc',
        cod_orden: 'ORD-001',
        estado: 'PROCESADO',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        costos: { total: 100 },
        items: [{ detalle_producto: { imagen: 'img.png' }, cantidad: 2 }],
        entrega: { tipo: 'RECOJO_TIENDA', fechaEntregaEstimada: new Date().toISOString() }
        }];

        const cursorMock = {
        project: () => cursorMock,
        sort: () => cursorMock,
        skip: () => cursorMock,
        limit: () => cursorMock,
        toArray: jest.fn().mockResolvedValue(fakeDocs),
        };

        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(1);

        const result = await service.findAllByUser(1, 1, 5);

        expect(result.data[0].cod_orden).toBe('ORD-001');
        expect(result.total).toBe(1);
        expect(result.lastPage).toBe(1);
    });
});
