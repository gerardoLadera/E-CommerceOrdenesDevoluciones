// src/pages/ordenes/components/DevolucionFiltros.tsx
import Input from '../../../components/Input';
import Select from '../../../components/Select';
import { EstadoDevolucion } from '../../../modules/devoluciones/types/enums';
import { Search, Filter } from 'lucide-react';
import type { EstadoDevolucion as EstadoDevolucionType } from '../../../modules/devoluciones/types/enums';

interface DevolucionFiltrosProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  estadoFiltro: EstadoDevolucionType | 'todos';
  onEstadoChange: (value: EstadoDevolucionType | 'todos') => void;
}

export const DevolucionFiltros = ({
  searchTerm,
  onSearchChange,
  estadoFiltro,
  onEstadoChange,
}: DevolucionFiltrosProps) => {
  const estadoOptions = [
    { value: 'todos', label: 'Todos los estados' },
    { value: EstadoDevolucion.PENDIENTE, label: 'Pendiente' },
    { value: EstadoDevolucion.PROCESANDO, label: 'Procesando' },
    { value: EstadoDevolucion.COMPLETADA, label: 'Completada' },
    { value: EstadoDevolucion.CANCELADA, label: 'Cancelada' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            type="text"
            placeholder="Buscar por ID de devolución u orden..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div>
          <Select
            value={estadoFiltro}
            onChange={(e) => onEstadoChange(e.target.value as EstadoDevolucionType | 'todos')}
            options={estadoOptions}
            leftIcon={Filter}
          />
        </div>
      </div>
    </div>
  );
};
