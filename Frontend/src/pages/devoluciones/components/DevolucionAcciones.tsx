// src/pages/ordenes/components/DevolucionAcciones.tsx
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EstadoDevolucion } from '../../../modules/devoluciones/types/enums';

interface DevolucionAccionesProps {
  devolucionId: string;
  estado: typeof EstadoDevolucion[keyof typeof EstadoDevolucion];
  onAprobar?: (id: string) => void;
  onRechazar?: (id: string) => void;
  onCompletar?: (id: string) => void;
  onCancelar?: (id: string) => void;
  isLoading?: boolean;
}

export const DevolucionAcciones = ({
  devolucionId,
  estado,
  onAprobar,
  onRechazar,
  onCompletar,
  onCancelar,
  isLoading = false,
}: DevolucionAccionesProps) => {
  const navigate = useNavigate();

  const handleVerDetalle = () => {
    navigate(`/ordenes/devoluciones/${devolucionId}`);
  };

  return (
    <div className="flex gap-2 items-center justify-end">
      <button
        type="button"
        onClick={handleVerDetalle}
        className="px-3 py-1 text-sm border border-gray-400 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        Ver
      </button>

      {estado === EstadoDevolucion.PENDIENTE && (
        <>
          {onAprobar && (
            <button
              type="button"
              onClick={() => onAprobar(devolucionId)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              Aprobar
            </button>
          )}
          {onRechazar && (
            <button
              type="button"
              onClick={() => onRechazar(devolucionId)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              Rechazar
            </button>
          )}
        </>
      )}

      {estado === EstadoDevolucion.PROCESANDO && onCompletar && (
        <button
          type="button"
          onClick={() => onCompletar(devolucionId)}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50"
        >
          Completar
        </button>
      )}

      {(estado === EstadoDevolucion.PENDIENTE || estado === EstadoDevolucion.PROCESANDO) &&
        onCancelar && (
          <button
            type="button"
            onClick={() => onCancelar(devolucionId)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
    </div>
  );
};
