import { ApiProperty } from '@nestjs/swagger';
import { Devolucion } from '../entities/devolucion.entity';

export class DireccionEnvioDto {
  @ApiProperty({
    description: 'Calle de la dirección de envío',
    example: 'Av. Principal 123',
  })
  calle: string;

  @ApiProperty({
    description: 'Ciudad de la dirección de envío',
    example: 'Caracas',
  })
  ciudad: string;

  @ApiProperty({
    description: 'Estado de la dirección de envío',
    example: 'Distrito Capital',
  })
  estado: string;

  @ApiProperty({
    description: 'Código postal',
    example: '1050',
  })
  codigoPostal: string;

  @ApiProperty({
    description: 'País',
    example: 'Venezuela',
  })
  pais: string;
}

export class InstruccionesDto {
  @ApiProperty({
    description: 'Pasos a seguir para realizar la devolución',
    example: [
      '1. Empaque el producto en su caja original',
      '2. Incluya todos los accesorios y documentación',
      '3. Imprima la etiqueta de envío adjunta',
      '4. Entregue el paquete en punto autorizado',
    ],
    isArray: true,
    type: [String],
  })
  pasos: string[];

  @ApiProperty({
    description: 'Dirección de envío para la devolución',
    type: DireccionEnvioDto,
    required: false,
  })
  direccionEnvio?: DireccionEnvioDto;

  @ApiProperty({
    description: 'Método de devolución',
    example: 'envio_domicilio',
  })
  metodoDevolucion: string;

  @ApiProperty({
    description: 'Fecha límite para realizar la devolución',
    example: '2025-11-14T23:59:59Z',
    type: Date,
  })
  plazoLimite: Date;

  @ApiProperty({
    description: 'URL de la etiqueta de envío',
    example: 'https://etiquetas.ejemplo.com/123456.pdf',
    required: false,
  })
  etiquetaEnvio?: string;
}

export class ItemDevolucionDto {
  @ApiProperty({
    description: 'ID del item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  itemId: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop HP Pavilion 15',
  })
  productoNombre: string;

  @ApiProperty({
    description: 'Cantidad a devolver',
    example: 1,
  })
  cantidad: number;

  @ApiProperty({
    description: 'Razón de la devolución',
    example: 'Producto defectuoso',
  })
  razon: string;
}

export class InstruccionesDevolucionDto {
  @ApiProperty({
    description: 'ID de la devolución',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  devolucionId: string;

  @ApiProperty({
    description: 'ID de la orden',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  orderId: string;

  @ApiProperty({
    description: 'Número de autorización único para la devolución',
    example: 'RET-20251107-123456',
  })
  numeroAutorizacion: string;

  @ApiProperty({
    description: 'Fecha de aprobación de la devolución',
    example: '2025-11-07T14:30:00Z',
    type: Date,
  })
  fechaAprobacion: Date;

  @ApiProperty({
    description: 'Instrucciones detalladas para realizar la devolución',
    type: InstruccionesDto,
  })
  instrucciones: InstruccionesDto;

  @ApiProperty({
    description: 'Items incluidos en la devolución',
    type: [ItemDevolucionDto],
    isArray: true,
  })
  items: ItemDevolucionDto[];

  @ApiProperty({
    description: 'Información adicional y recomendaciones',
    example: [
      'Asegúrese de que el producto esté en su empaque original',
      'La devolución debe realizarse dentro de los próximos 7 días',
      'Recibirá un correo de confirmación una vez procesado el reembolso',
    ],
    isArray: true,
    type: [String],
  })
  informacionAdicional: string[];
}

export class AprobarDevolucionResponseDto {
  @ApiProperty({
    description: 'Devolución actualizada',
    type: () => Devolucion,
  })
  devolucion: Devolucion;

  @ApiProperty({
    description: 'Instrucciones generadas para realizar la devolución',
    type: InstruccionesDevolucionDto,
  })
  instrucciones: InstruccionesDevolucionDto;
}
