// src/pages/ordenes/components/DevolucionTabla.tsx
import { TableHeader, TableCell } from '../../../components/Table';
import type { Devolucion } from '../../../modules/devoluciones/types/devolucion';
import { DevolucionEstadoBadge } from './DevolucionEstadoBadge';
import { DevolucionAcciones } from './DevolucionAcciones';
import { formatDateShort, formatCurrency } from '../../../modules/devoluciones/utils/formatters';

interface DevolucionTablaProps {
  devoluciones: Devolucion[];
  isLoading?: boolean;
  onAprobar?: (id: string) => void;
  onRechazar?: (id: string) => void;
  onCompletar?: (id: string) => void;
  onCancelar?: (id: string) => void;
}

export const DevolucionTabla: React.FC<DevolucionTablaProps> = ({
  devoluciones,
  isLoading = false,
  onAprobar,
  onRechazar,
  onCompletar,
  onCancelar,
}) => {
  if (devoluciones.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg">No hay devoluciones registradas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <TableHeader label="ID Devolución" />
            <TableHeader label="ID Orden" />
            <TableHeader label="Fecha Creación" />
            <TableHeader label="Estado" />
            <TableHeader label="Fecha Procesamiento" />
            <TableHeader label="Reembolso" />
            <TableHeader label="Reemplazo" />
            <TableHeader label="Acciones" className="text-right" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {devoluciones.map((devolucion) => (
            <tr key={devolucion.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-blue-600">
                {devolucion.id.substring(0, 8)}...
              </TableCell>
              <TableCell>{devolucion.orderId.substring(0, 8)}...</TableCell>
              <TableCell>{formatDateShort(devolucion.createdAt)}</TableCell>
              <TableCell>
                <DevolucionEstadoBadge estado={devolucion.estado} />
              </TableCell>
              <TableCell>
                {devolucion.fecha_procesamiento
                  ? formatDateShort(devolucion.fecha_procesamiento)
                  : '-'}
              </TableCell>
              <TableCell>
                {devolucion.reembolso ? (
                  <span className="text-green-600 font-medium">
                    {formatCurrency(devolucion.reembolso.monto, devolucion.reembolso.moneda)}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {devolucion.orden_reemplazo_id ? (
                  <span className="text-blue-600 text-xs">
                    {devolucion.orden_reemplazo_id.substring(0, 8)}...
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <DevolucionAcciones
                  devolucionId={devolucion.id}
                  estado={devolucion.estado}
                  onAprobar={onAprobar}
                  onRechazar={onRechazar}
                  onCompletar={onCompletar}
                  onCancelar={onCancelar}
                  isLoading={isLoading}
                />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
