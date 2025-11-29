

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersModule } from '../src/orders/orders.module';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/orderItem.entity';
import { OrderHistory } from '../src/orders/entities/orderHistory.entity';
import { Pago } from '../src/orders/entities/pago.entity';
import { InventoryService } from '../src/orders/inventory/inventory.service';
import { CatalogService } from '../src/orders/catalog/catalog.service';
import { PaymentsClient } from '../src/orders/payments/payments.service';




describe('OrdersController (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleBuilder = Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: ':memory:',
                entities: [Order, OrderItem, OrderHistory, Pago],
                synchronize: true,
                dropSchema: true,
            }),
            OrdersModule,
        ],
        })
        .overrideProvider('KAFKA_SERVICE')
        .useValue({ emit: jest.fn(), send: jest.fn(), connect: jest.fn(), close: jest.fn() })

        .overrideProvider(InventoryService)
        .useValue({
        reserveStock: jest.fn().mockResolvedValue({ success: true })
        })
        .overrideProvider(CatalogService)
        .useValue({
        obtenerDetalles: jest.fn().mockResolvedValue({})
        })
        .overrideProvider(PaymentsClient)
        .useValue({
        procesarPago: jest.fn().mockResolvedValue({
            pago_id: 'mock-pago-123',
            metodoPago: 'SIMULADO',
            status: 'PAGO_EXITOSO',
            fecha_pago: new Date().toISOString(),
            datosPago: { referencia: 'mock-ref' }
        })
        });

        const moduleFixture: TestingModule = await moduleBuilder.compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();

        dataSource = app.get(DataSource);
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        console.log('Conexión inicializada:', dataSource.isInitialized);
    });

    afterAll(async () => {
        await app.close();
    });

    it('debería crear una orden de forma exitosa (201) con tipo de entrega "RECOJO_TIENDA"', async () => {
        const payload = {
        usuarioId: 123,
        direccionEnvio: {
            nombreCompleto: "Juan Pérez",
            telefono: "+51 987654321",
            direccionLinea1: "Av. Siempre Viva 742",
            ciudad: "Lima",
            provincia: "Lima",
            codigoPostal: "15001",
            pais: "Perú"
        },
        items: [
            { productoId: 4 ,nombreProducto: "Camisa Negra ", cantidad: 1, precioUnitario: 50.0, subTotal: 100.0 }
        ],
        costos: { subtotal: 100.0, envio: 0.0, total: 118.0 },
        entrega: {
            tipo: "RECOJO_TIENDA",
            almacenOrigen: { id: 2, nombre: "Almacén Cusco", direccion: "Av. El Sol 456", latitud: -13.5319, longitud: -71.9675 },
            tiendaSeleccionada: { id: 4, nombre: "Tienda Surco Mall", direccion: "Av. Primavera 890", latitud: -12.145, longitud: -77.01 },
            costoEnvio: 0.0,
            tiempoEstimadoDias: 0,
            fechaEntregaEstimada: "2025-11-08T08:00:18.931Z",
            descripcion: "Recoge tu pedido en tienda sin costo adicional"
        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
        };

        const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(payload)
        .expect(201);

        expect(response.body).toHaveProperty('orden_id');
        expect(response.body.estado).toBe('CREADO');
    });

    it('debería crear una orden exitosa (201) con entrega a DOMICILIO', async () => {
        
        const inventoryService = app.get(InventoryService);
        inventoryService.reserveStock = jest.fn().mockResolvedValue({ success: true });

        const payloadDomicilio = {
        usuarioId: 123, 
        direccionEnvio: {
            nombreCompleto: "Juan Pérez",
            telefono: "+51 987654321",
            direccionLinea1: "Av. Siempre Viva 742",
            direccionLinea2: "Depto 301", 
            ciudad: "Lima",
            provincia: "Lima",
            codigoPostal: "15001",
            pais: "Perú"
        },
        items: [
            { productoId: 1, nombreProducto: "Camiseta Azul", cantidad: 2, precioUnitario: 50.0, subTotal: 100.0 },
            { productoId: 2, nombreProducto: "Zapatillas Running", cantidad: 1, precioUnitario: 250.0, subTotal: 250.0 }
        ],
        costos: {
            subtotal: 350.0,
            envio: 119.69,
            total: 532.69
        },
        entrega: {
            tipo: "DOMICILIO",
            almacenOrigen: {
                id: 2,
                nombre: "Almacén Cusco",
                direccion: "Av. El Sol 456 - Almacén Cusco",
                latitud: -13.5319,
                longitud: -71.9675
            },
            carrierSeleccionado: {
                carrier_id: 1,
                carrier_nombre: "FedEx Express",
                carrier_codigo: "FEDEX",
                costo_envio: 119.69,
                tiempo_estimado_dias: 8,
                fecha_entrega_estimada: "2025-11-16T08:00:18.976Z",
                cotizacion_id: "cmhpzvgv7000jlc016qi9jueu"
            },
            direccionEnvioId: 12

        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
    };

        const response = await request(app.getHttpServer())
            .post('/api/orders')
            .send(payloadDomicilio)
            .expect(201);

        // Verificaciones básicas
        expect(response.body).toHaveProperty('orden_id');
        expect(response.body.estado).toBe('CREADO');
        expect(response.body.entrega.tipo).toBe('DOMICILIO');

        
        await new Promise(resolve => setTimeout(resolve, 50)); 
        
        // Verificación clave: El servicio de inventario fue llamado con el payload correcto de DOMICILIO
        expect(inventoryService.reserveStock).toHaveBeenCalledWith(
            expect.objectContaining({
                tipo_envio: 'DOMICILIO',
                id_carrier: 1, 
                direccion_envio: payloadDomicilio.direccionEnvio.direccionLinea1,
            })
        );
    });




    it('debería devolver 400 si falta algún campo en el payload', async () => {
    const payloadInvalido = {
        direccionEnvio: { nombreCompleto: 'Juan Pérez' }, 
        items: [],
        costos: { subtotal: 0, envio: 0, total: 0 },
        entrega: { tipo: 'RECOJO_TIENDA' },
        metodoPago: 'SIMULADO',
        estadoInicial: 'PENDIENTE',
    };

    await request(app.getHttpServer())
        .post('/api/orders')
        .send(payloadInvalido)
        .expect(400);
    });

    it('debería responder con 201 (CREADO) y luego persistir el estado CANCELADO si el inventario falla', async () => {
        
        const inventoryService = app.get(InventoryService);
        inventoryService.reserveStock = jest.fn().mockRejectedValue(new Error('Stock no disponible'));

        const payloadValido = {
            usuarioId: 124,
            direccionEnvio: {
                nombreCompleto: 'Maria López',
                telefono: '+51 912345678',
                direccionLinea1: 'Calle Falsa 123',
                ciudad: 'Lima',
                provincia: 'Lima',
                codigoPostal: '15001',
                pais: 'Perú',
            },
            items: [
                { productoId: 5, nombreProducto: 'Pantalón Azul', cantidad: 2, precioUnitario: 80.0, subTotal: 160.0 },
            ],
            costos: { subtotal: 160.0, envio: 0.0, total: 188.8 },
            entrega: { tipo: 'RECOJO_TIENDA' },
            metodoPago: 'SIMULADO',
            estadoInicial: 'PENDIENTE',
        };

        const response = await request(app.getHttpServer())
            .post('/api/orders')
            .send(payloadValido)
            .expect(201); 

        const ordenId = response.body.orden_id;


        await new Promise(resolve => setTimeout(resolve, 50)); 

        
        const orderRepository = dataSource.getRepository(Order);
        const finalOrder = await orderRepository.findOne({ where: { orden_id: ordenId } });

        //Estado FINAL de la base de datos
        expect(finalOrder).not.toBeNull();
        expect(finalOrder!.estado).toBe('CANCELADO');
        expect(inventoryService.reserveStock).toHaveBeenCalledTimes(1);
    });






    it('debería responder con 201 (CREADO) y luego persistir el estado CANCELADO si el servicio de pagos falla', async () => {
    
    const paymentsClient = app.get(PaymentsClient);
    paymentsClient.procesarPago = jest.fn().mockRejectedValue(new Error('Error externo'));

    const payloadValido = {
        usuarioId: 123,
        direccionEnvio: {
        nombreCompleto: 'Juan Pérez',
        telefono: '+51 987654321',
        direccionLinea1: 'Av. Siempre Viva 742',
        ciudad: 'Lima',
        provincia: 'Lima',
        codigoPostal: '15001',
        pais: 'Perú',
        },
        items: [
        { productoId: 4, nombreProducto: 'Camisa Negra', cantidad: 1, precioUnitario: 50.0, subTotal: 100.0 },
        ],
        costos: { subtotal: 100.0, envio: 0.0, total: 118.0 },
        entrega: { tipo: 'RECOJO_TIENDA' },
        metodoPago: 'SIMULADO',
        estadoInicial: 'PENDIENTE',
    };

    const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(payloadValido)
        .expect(201); 

    const ordenId = response.body.orden_id;
    await new Promise(resolve => setTimeout(resolve, 50));

    const orderRepository = dataSource.getRepository(Order);
    const finalOrder = await orderRepository.findOne({ where: { orden_id: ordenId } });

    // Verificamos el estado final de la orden en la base de datos
    expect(finalOrder!.estado).toBe('CANCELADO');
    });
});
