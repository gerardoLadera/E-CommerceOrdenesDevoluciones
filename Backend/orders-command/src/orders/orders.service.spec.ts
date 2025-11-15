import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderHistory } from './entities/orderHistory.entity';
import { Pago } from './entities/pago.entity';
import { KafkaService } from '../kafka/kafka.service';
import { InventoryService } from './inventory/inventory.service';
import { PaymentsClient } from './payments/payments.service';
import { CatalogService } from './catalog/catalog.service';
import { Repository } from 'typeorm';

describe('OrdersService', () => {
    let service: OrdersService;
    let orderRepo: Repository<Order>;

    const mockOrderRepo = {
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        }),
    };

    const mockItemRepo = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockHistoryRepo = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockPagoRepo = {};

    const mockKafkaService = {
        emitOrderCreated: jest.fn(),
        emitOrderCancelled: jest.fn(),
    };

    const mockInventoryService = {
        reserveStock: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockPaymentsClient = {
        procesarPago: jest.fn(),
    };

    const mockCatalogService = {
        obtenerDetalles: jest.fn().mockResolvedValue({}),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrdersService,
            { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
            { provide: getRepositoryToken(OrderItem), useValue: mockItemRepo },
            { provide: getRepositoryToken(OrderHistory), useValue: mockHistoryRepo },
            { provide: getRepositoryToken(Pago), useValue: mockPagoRepo },
            { provide: KafkaService, useValue: mockKafkaService },
            { provide: InventoryService, useValue: mockInventoryService },
            { provide: PaymentsClient, useValue: mockPaymentsClient },
            { provide: CatalogService, useValue: mockCatalogService },
        ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    //Prueba para creación de orden para tipo de entrega en tienda
    it('debería crear una orden exitosamente con entrega : RECOJO_TIENDA', async () => {
        const mockDto = {
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
        costos: { subtotal: 350.0, impuestos: 63.0, envio: 0.0, total: 413.0 },
        entrega: {
            tipo: "RECOJO_TIENDA",
            almacenOrigen: { id: 2, nombre: "Almacén Cusco", direccion: "Av. El Sol 456 - Almacén Cusco", latitud: -13.5319, longitud: -71.9675 },
            tiendaSeleccionada: { id: 5, nombre: "Tienda Surco Mall", direccion: "Av. Primavera 890 - Tienda Sur", latitud: -12.145, longitud: -77.01, distancia_km: 11.53 },
            costoEnvio: 0.0,
            tiempoEstimadoDias: 0,
            fechaEntregaEstimada: "2025-11-08T08:00:18.931Z",
            descripcion: "Recoge tu pedido en tienda sin costo adicional"
        },
        metodoPago: "SIMULADO",
        estadoInicial: "PENDIENTE"
        };

        const mockOrder = { orden_id: 'uuid-123', num_orden: 1,estado: 'CREADO' };
        mockOrderRepo.create.mockReturnValue(mockOrder);
        mockOrderRepo.save.mockResolvedValue(mockOrder);
        mockItemRepo.create.mockReturnValue({ productoId: 1 });
        mockItemRepo.save.mockResolvedValue([{ productoId: 1 }]);
        mockHistoryRepo.create.mockReturnValue({});
        mockHistoryRepo.save.mockResolvedValue({});

        service['procesarPago'] = jest.fn().mockResolvedValue(true);

        const result = await service.createOrder(mockDto);

        expect(mockOrderRepo.create).toHaveBeenCalled();
        expect(mockOrderRepo.save).toHaveBeenCalled();
        expect(mockItemRepo.save).toHaveBeenCalled();
        expect(mockKafkaService.emitOrderCreated).toHaveBeenCalled();
        expect(result).toHaveProperty('orden_id');
        expect(result.estado).toBe('CREADO');
        expect(result).toHaveProperty('items');
    });

    //Prueba para creación de orden para tipo de entrega a domicilio
    it('debería crear una orden exitosamente con entrega : DOMICILIO', async () => {
        const mockDto = {
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
        costos: { subtotal: 350.0, impuestos: 63.0, envio: 119.69, total: 532.69 },
        entrega: {
            tipo: "DOMICILIO",
            almacenOrigen: { id: 2, nombre: "Almacén Cusco", direccion: "Av. El Sol 456 - Almacén Cusco", latitud: -13.5319, longitud: -71.9675 },
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

        const mockOrder = { orden_id: 'uuid-456', num_orden: 2, estado: 'CREADO' };
        mockOrderRepo.create.mockReturnValue(mockOrder);
        mockOrderRepo.save.mockResolvedValue(mockOrder);
        mockItemRepo.create.mockReturnValue({ productoId: 1 });
        mockItemRepo.save.mockResolvedValue([{ productoId: 1 }]);
        mockHistoryRepo.create.mockReturnValue({});
        mockHistoryRepo.save.mockResolvedValue({});

        service['procesarPago'] = jest.fn().mockResolvedValue(true);

        const result = await service.createOrder(mockDto);

        expect(mockOrderRepo.create).toHaveBeenCalled();
        expect(mockOrderRepo.save).toHaveBeenCalled();
        expect(mockItemRepo.save).toHaveBeenCalled();
        expect(mockKafkaService.emitOrderCreated).toHaveBeenCalled();
        expect(result).toHaveProperty('orden_id');
        expect(result.estado).toBe('CREADO');
        expect(result).toHaveProperty('items');
    });

    //Prueba para fallo en inventoryService (Caso en el que se cancela la orden)
    it('debería cancelarse la orden cuando inventoryService.reserveStock lanza un error', async () => {
    const mockDto = {
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
        { productoId: 1, nombreProducto: "Camiseta Azul", cantidad: 2, precioUnitario: 50.0, subTotal: 100.0 }
        ],
        costos: { subtotal: 100.0, impuestos: 18.0, envio: 0.0, total: 118.0 },
        entrega: {
        tipo: "DOMICILIO",
        almacenOrigen: { id: 2, nombre: "Almacén Cusco", direccion: "Av. El Sol 456", latitud: -13.5319, longitud: -71.9675 },
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

    const mockOrder = { orden_id: 'uuid-789', num_orden: 3, estado: 'CREADO' };
    mockOrderRepo.create.mockReturnValue(mockOrder);
    mockOrderRepo.save.mockResolvedValue(mockOrder);
    mockItemRepo.create.mockReturnValue({ productoId: 1 });
    mockItemRepo.save.mockResolvedValue([{ productoId: 1 }]);
    mockHistoryRepo.create.mockReturnValue({});
    mockHistoryRepo.save.mockResolvedValue({});

    // Error  simulado en inventoryService
    mockInventoryService.reserveStock.mockRejectedValue(new Error('Stock insuficiente'));

    // Mockear procesarPago para que no interfiera
    service['procesarPago'] = jest.fn().mockResolvedValue(true);

    const result = await service.createOrder(mockDto);

    // Validaciones
    expect(result.estado).toBe('CANCELADO');
    expect(mockKafkaService.emitOrderCancelled).toHaveBeenCalled();
    expect(mockOrderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: 'CANCELADO' }));
    expect(mockHistoryRepo.save).toHaveBeenCalled(); // historial de cancelación creado
    });

});
