import { Injectable, Logger } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { ObjectId } from 'mongodb'; // Necesario para trabajar con _id de Mongo

@Injectable()
export class DevolucionesService {
  private readonly logger = new Logger(DevolucionesService.name);

  constructor(private readonly mongoService: MongoService) {}

  /**
   * Obtiene todas las devoluciones, usando un pipeline de agregación
   * para obtener el nombre del cliente y el tipo de devolución.
   */
  async findAll(): Promise<any[]> {
    this.logger.log(
      'Consultando devoluciones con cálculo automático de tipoDevolucion.',
    );

    const collection = this.mongoService.getCollection('devoluciones');

    const pipeline = [
      // 1. Lookup con ordenes
      {
        $lookup: {
          from: 'ordenes',
          // [IMPORTANTE]: Tu findAll usa foreignField: '_id', asumo que
          // orderId en devoluciones es un ObjectId. Si fuera un string (UUID),
          // foreignField debe ser 'cod_orden'. Mantengo tu lógica de ObjectId.
          localField: 'ordenId',
          foreignField: '_id', // <-- Asumiendo que orderId es un ObjectId
          as: 'ordenInfo',
        },
      },

      // 2. Unwind de ordenInfo
      {
        $unwind: {
          path: '$ordenInfo',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 3. Project final
      {
        $project: {
          _id: 0, // Ocultamos _id original
          id: { $toString: '$_id' }, // Convertimos ObjectId → string

          codDevolucion: 1,
          estado: 1,
          createdAt: 1,

          // Código de la orden
          orderId: {
            // Si la unión falla, devolvemos el valor de ordenId del documento de devolución
            $ifNull: ['$ordenInfo.cod_orden', '$ordenId'],
          },

          // Nombre del cliente (si existe)
          nombreCliente: {
            $ifNull: ['$ordenInfo.direccionEnvio.nombreCompleto', null],
          },

          // Tipo de devolución (reemplazo / reembolso / mixto)
          tipoDevolucion: {
            $switch: {
              branches: [
                // Todos reembolso
                {
                  case: {
                    $allElementsTrue: {
                      $map: {
                        input: { $ifNull: ['$items', []] },
                        as: 'it',
                        in: { $eq: ['$$it.tipo_accion', 'reembolso'] },
                      },
                    },
                  },
                  then: 'reembolso',
                },
                // Todos reemplazo
                {
                  case: {
                    $allElementsTrue: {
                      $map: {
                        input: { $ifNull: ['$items', []] },
                        as: 'it',
                        in: { $eq: ['$$it.tipo_accion', 'reemplazo'] },
                      },
                    },
                  },
                  then: 'reemplazo',
                },
              ],
              default: 'mixto',
            },
          },
        },
      },

      // 4. Ordenar
      {
        $sort: { createdAt: -1 },
      },

      // 5. Limitar
      {
        $limit: 1000,
      },
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  /**
   * Obtiene el detalle de una devolución por su ID (usado por el frontend 'DevolucionDetallePage').
   * Utiliza un pipeline de agregación para inyectar los datos del cliente de la orden.
   * @param id El _id de MongoDB de la devolución (string).
   */
  async findOne(id: string): Promise<any> {
    this.logger.log(`Buscando detalle de devolución con _id: ${id}`);

    if (!ObjectId.isValid(id)) {
      this.logger.warn('ID de devolución inválido');
      return null;
    }

    const collection = this.mongoService.getCollection('devoluciones');

    const pipeline = [
      // 1. Filtrar por _id
      {
        $match: { _id: new ObjectId(id) },
      },

      // 2. Unir con la colección 'ordenes' (para obtener datos del cliente)
      // Usamos el mismo localField/foreignField que tu findAll (asumiendo que es correcto)
      {
        $lookup: {
          from: 'ordenes',
          localField: 'ordenId',
          foreignField: '_id', // <-- Asumiendo que orderId en devoluciones es un ObjectId
          as: 'ordenInfo',
        },
      },

      // 3. Desestructurar 'ordenInfo'
      {
        $unwind: {
          path: '$ordenInfo',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4. Proyección Final: Mapear a la estructura del frontend
      {
        $project: {
          // Campos directos de la devolución (Historial e Items son necesarios)
          id: { $toString: '$_id' },
          codDevolucion: 1,
          estado: 1,
          createdAt: 1,
          items: 1, // <--- Necesario para la tabla de artículos
          historial: 1, // <--- Necesario para la tabla de historial

          // orderId: Priorizamos el cod_orden de la orden
          orderId: {
            $ifNull: ['$ordenInfo.cod_orden', '$ordenId'],
          },
          codOrden: {
            $ifNull: ['$ordenInfo.cod_orden', null],
          },

          // Mapeamos la info de la orden a la estructura 'datosCliente' que espera el frontend
          datosCliente: {
            nombres: {
              $ifNull: ['$ordenInfo.direccionEnvio.nombreCompleto', null],
            },
            telefono: { $ifNull: ['$ordenInfo.direccionEnvio.telefono', null] },
            direccion: {
              $ifNull: ['$ordenInfo.direccionEnvio.direccion', null],
            },
          },

          // Otros campos de resumen
          tipoDevolucion: { $literal: null },
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();

    // Devolvemos el primer documento encontrado (o null)
    if (result.length === 0) {
      return null;
    }

    return result[0];
  }
}
