import { KafkaConsumerService } from './kafka.consumer';
import { MongoService } from '../mongo/mongo.service';

describe('KafkaConsumerService - Handlers', () => {
    let service: KafkaConsumerService;
    const mockCollection = {
        insertOne: jest.fn(),
        updateOne: jest.fn(),
    };
    const mongoService = {
        getCollection: jest.fn().mockReturnValue(mockCollection),
    };

    beforeEach(() => {
        service = new KafkaConsumerService(mongoService as any);
        jest.clearAllMocks();
    });

    it('handleOrderCreated debe replicar orden en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'abc',
            num_orden: 1,
            cod_Orden: 'ORD-001',
            clienteId: 123,
            direccionEnvio: { ciudad: 'Lima' },
            costos: { total: 100 },
            entrega: { tipo: 'DOMICILIO' },
            metodoPago: 'TARJETA',
            estado: 'CREADA',
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            orden_items: [],
        },
        };

        await service.handleOrderCreated(payload);

        expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
            _id: 'abc',
            estado: 'CREADA',
            num_orden: 1,
        }),
        );
    });

    it('handleOrderCancelled debe replicar orden CANCELADA en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'def',
            num_orden: 2,
            cod_Orden: 'ORD-002',
            clienteId: 456,
            estado: 'CANCELADA',
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
        },
        };

        await service.handleOrderCancelled(payload);

        expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
            _id: 'def',
            estado: 'CANCELADA',
            num_orden: 2,
        }),
        );
    });

    it('handleOrderPaid debe actualizar orden como PAGADA en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'ghi',
            estadoNuevo: 'PAGADA',
            fechaActualizacion: new Date().toISOString(),
            pago: {
            pago_id: 'p1',
            metodo: 'TARJETA',
            estado: 'COMPLETADO',
            fecha_pago: new Date().toISOString(),
            datosPago: { ref: '123' },
            },
            historialNuevo: {
            estadoAnterior: 'CREADA',
            estadoNuevo: 'PAGADA',
            fechaModificacion: new Date().toISOString(),
            modificadoPor: 'Sistema',
            motivo: 'Pago confirmado',
            },
        },
        };

        await service.handleOrderPaid(payload);

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'ghi' },
        expect.objectContaining({
            $set: expect.objectContaining({ estado: 'PAGADA' }),
            $push: expect.any(Object),
        }),
        { upsert: false },
        );
    });

    it('handleOrderConfirmed debe actualizar orden como CONFIRMADA en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'jkl',
            estadoNuevo: 'CONFIRMADA',
            fechaActualizacion: new Date().toISOString(),
            historialNuevo: {
            estadoAnterior: 'PAGADA',
            estadoNuevo: 'CONFIRMADA',
            fechaModificacion: new Date().toISOString(),
            modificadoPor: 'Sistema',
            motivo: 'Confirmación exitosa',
            },
        },
        };

        await service.handleOrderConfirmed(payload);

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'jkl' },
        expect.objectContaining({
            $set: expect.objectContaining({ estado: 'CONFIRMADA' }),
            $push: expect.any(Object),
        }),
        { upsert: false },
        );
    });

    it('handleOrderProcessed debe actualizar orden como PROCESADA en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'mno',
            estadoNuevo: 'PROCESADA',
            fechaActualizacion: new Date().toISOString(),
            historialNuevo: {
            estadoAnterior: 'CONFIRMADA',
            estadoNuevo: 'PROCESADA',
            fechaModificacion: new Date().toISOString(),
            modificadoPor: 'Sistema',
            motivo: 'Procesamiento completado',
            },
        },
        };

        await service.handleOrderProcessed(payload);

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'mno' },
        expect.objectContaining({
            $set: expect.objectContaining({ estado: 'PROCESADA' }),
            $push: expect.any(Object),
        }),
        { upsert: false },
        );
    });

    it('handleOrderDelivered debe actualizar orden como ENTREGADA en Mongo', async () => {
        const payload = {
        data: {
            orden_id: 'pqr',
            estadoNuevo: 'ENTREGADA',
            fechaActualizacion: new Date().toISOString(),
            evidenciasEntrega: [{ tipo: 'FOTO', valor: 'img.png' }],
            historialNuevo: {
            estadoAnterior: 'PROCESADA',
            estadoNuevo: 'ENTREGADA',
            fechaModificacion: new Date().toISOString(),
            modificadoPor: 'Sistema',
            motivo: 'Entrega confirmada',
            },
        },
        };

        await service.handleOrderDelivered(payload);

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'pqr' },
        expect.objectContaining({
            $set: expect.objectContaining({ estado: 'ENTREGADA' }),
            $push: expect.any(Object),
        }),
        { upsert: false },
        );
    });
});
