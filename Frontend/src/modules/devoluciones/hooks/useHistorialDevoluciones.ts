// src/modules/devoluciones/hooks/useHistorialDevoluciones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historialService } from '../api/historialService';
import type {
  DevolucionHistorial,
  CreateDevolucionHistorialDto,
  UpdateDevolucionHistorialDto,
} from '../types/devolucion';

export const useHistorialDevoluciones = (devolucionId?: string) => {
  const queryClient = useQueryClient();

  // Si se proporciona devolucionId, obtener solo el historial de esa devolución
  const {
    data: historial = [],
    isLoading,
    error,
    refetch,
  } = useQuery<DevolucionHistorial[]>({
    queryKey: devolucionId ? ['historial-devolucion', devolucionId] : ['historial-devolucion'],
    queryFn: devolucionId 
      ? () => historialService.findByDevolucion(devolucionId)
      : historialService.findAll,
    enabled: !devolucionId || !!devolucionId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDevolucionHistorialDto) => historialService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historial-devolucion'] });
      queryClient.invalidateQueries({ queryKey: ['historial-devolucion', variables.devolucion_id] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDevolucionHistorialDto }) =>
      historialService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historial-devolucion'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => historialService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historial-devolucion'] });
    },
  });

  return {
    historial,
    isLoading,
    error,
    refetch,
    createHistorial: createMutation.mutateAsync,
    updateHistorial: updateMutation.mutateAsync,
    eliminarHistorial: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useRegistroHistorial = (id: string) => {
  const {
    data: registro,
    isLoading,
    error,
    refetch,
  } = useQuery<DevolucionHistorial>({
    queryKey: ['registro-historial', id],
    queryFn: () => historialService.findOne(id),
    enabled: !!id,
  });

  return {
    registro,
    isLoading,
    error,
    refetch,
  };
};
