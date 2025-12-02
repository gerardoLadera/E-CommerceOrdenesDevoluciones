// src/pages/ordenes/components/DevolucionEstadoBadge.tsx
import { StatusBadge } from '../../../components/Table';
import type { EstadoDevolucion } from '../../../modules/devoluciones/types/enums';
import { getEstadoBadgeColor, getEstadoLabel } from '../../../modules/devoluciones/utils/formatters';

interface DevolucionEstadoBadgeProps {
  estado: EstadoDevolucion;
}

export const DevolucionEstadoBadge = ({ estado }: DevolucionEstadoBadgeProps) => {
  return (
    <StatusBadge 
      label={getEstadoLabel(estado)}
      variant={getEstadoBadgeColor(estado)}
    />
  );
};
