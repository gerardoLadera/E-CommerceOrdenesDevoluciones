// src/modules/ordenes/hooks/useDevoluciones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devolucionService } from '../api/devolucionService';
import type {
  Devolucion,
  CreateDevolucionDto,
  AprobarDevolucionDto,
  RechazarDevolucionDto,
  UpdateDevolucionDto,
} from '../types/devolucion';

export const useDevoluciones = () => {
  const queryClient = useQueryClient();

  const {
    data: devoluciones = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Devolucion[]>({
    queryKey: ['devoluciones'],
    queryFn: devolucionService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDevolucionDto) => devolucionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDevolucionDto }) =>
      devolucionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AprobarDevolucionDto }) =>
      devolucionService.aprobar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RechazarDevolucionDto }) =>
      devolucionService.rechazar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const completarMutation = useMutation({
    mutationFn: (id: string) => devolucionService.markAsCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => devolucionService.markAsCancelled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => devolucionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  return {
    devoluciones,
    isLoading,
    error,
    refetch,
    createDevolucion: createMutation.mutateAsync,
    updateDevolucion: updateMutation.mutateAsync,
    aprobarDevolucion: aprobarMutation.mutateAsync,
    rechazarDevolucion: rechazarMutation.mutateAsync,
    completarDevolucion: completarMutation.mutateAsync,
    cancelarDevolucion: cancelarMutation.mutateAsync,
    eliminarDevolucion: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isAprobando: aprobarMutation.isPending,
    isRechazando: rechazarMutation.isPending,
  };
};

export const useDevolucion = (id: string) => {
  const {
    data: devolucion,
    isLoading,
    error,
    refetch,
  } = useQuery<Devolucion>({
    queryKey: ['devolucion', id],
    queryFn: () => devolucionService.findOne(id),
    enabled: !!id,
  });

  return {
    devolucion,
    isLoading,
    error,
    refetch,
  };
};
