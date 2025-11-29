// src/modules/ordenes/utils/formatters.ts

import type { EstadoDevolucion } from '../types/enums';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatDateShort = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
};

export const getEstadoBadgeColor = (estado: EstadoDevolucion): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (estado) {
    case 'pendiente':
      return 'warning';
    case 'procesando':
      return 'neutral';
    case 'completada':
      return 'success';
    case 'cancelada':
      return 'danger';
    default:
      return 'neutral';
  }
};

export const getEstadoLabel = (estado: EstadoDevolucion): string => {
  const labels: Record<string, string> = {
    'pendiente': 'Pendiente',
    'procesando': 'Procesando',
    'completada': 'Completada',
    'cancelada': 'Cancelada',
  };
  return labels[estado] || estado;
};
