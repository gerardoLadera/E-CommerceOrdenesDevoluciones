import { OrdersService } from './orders.service';


describe('OrdersService.findAll', () => {
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

    it('debe devolver lista mapeada sin filtros', async () => {
        const fakeDocs = [{
            _id: 'abc',
            cod_orden: 'ORD-001',
            direccionEnvio: { nombreCompleto: 'Gerardo Ladera' },
            fechaCreacion: new Date(),
            estado: 'PROCESADO',
            tiene_devolucion: false,
            costos: { total: 120 }
        }];
        const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue(fakeDocs) };
        mockCollection.find.mockReturnValue(cursorMock);
        mockCollection.countDocuments.mockResolvedValue(1);

        const result = await service.findAll({ page: 1, limit: 5 });
        expect(result.data[0].cod_orden).toBe('ORD-001');
        expect(result.total).toBe(1);
        expect(result.lastPage).toBe(1);
    });

    it('debe aplicar filtro por busquedaId', async () => {
            const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
            mockCollection.find.mockImplementation(query => {
            expect(query.cod_orden).toBe('ORD-123');
            return cursorMock;
        });
        mockCollection.countDocuments.mockResolvedValue(0);

        await service.findAll({ page: 1, limit: 5, busquedaId: 'ORD-123' });
    });

    it('debe aplicar filtro por busquedaCliente', async () => {
            const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
            mockCollection.find.mockImplementation(query => {
            expect(query['direccionEnvio.nombreCompleto'].$regex).toBe('Gerardo');
            return cursorMock;
        });
        mockCollection.countDocuments.mockResolvedValue(0);

        await service.findAll({ page: 1, limit: 5, busquedaCliente: 'Gerardo' });
    });

    it('debe aplicar filtro por estado', async () => {
            const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
            mockCollection.find.mockImplementation(query => {
            expect(query.estado).toBe('ENTREGADO');
            return cursorMock;
        });
        mockCollection.countDocuments.mockResolvedValue(0);

        await service.findAll({ page: 1, limit: 5, estado: 'ENTREGADO' });
    });

    it('debe aplicar filtro por rango de fechas', async () => {
            const cursorMock = { project: () => cursorMock, sort: () => cursorMock, skip: () => cursorMock, limit: () => cursorMock, toArray: jest.fn().mockResolvedValue([]) };
            mockCollection.find.mockImplementation(query => {
            expect(query.fechaCreacion.$gte).toBeInstanceOf(Date);
            expect(query.fechaCreacion.$lte).toBeInstanceOf(Date);
            return cursorMock;
        });
        mockCollection.countDocuments.mockResolvedValue(0);

        await service.findAll({ page: 1, limit: 5, fechaInicio: '2025-11-01', fechaFin: '2025-11-30' });
    });
});
