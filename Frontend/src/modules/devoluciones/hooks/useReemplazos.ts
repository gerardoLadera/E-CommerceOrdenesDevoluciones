// src/modules/devoluciones/hooks/useReemplazos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reemplazoService } from '../api/reemplazoService';
import type {
  Reemplazo,
  CreateReemplazoDto,
  UpdateReemplazoDto,
} from '../types/devolucion';

export const useReemplazos = () => {
  const queryClient = useQueryClient();

  const {
    data: reemplazos = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Reemplazo[]>({
    queryKey: ['reemplazos'],
    queryFn: reemplazoService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReemplazoDto) => reemplazoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reemplazos'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReemplazoDto }) =>
      reemplazoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reemplazos'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reemplazoService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reemplazos'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  return {
    reemplazos,
    isLoading,
    error,
    refetch,
    createReemplazo: createMutation.mutateAsync,
    updateReemplazo: updateMutation.mutateAsync,
    eliminarReemplazo: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useReemplazo = (id: string) => {
  const {
    data: reemplazo,
    isLoading,
    error,
    refetch,
  } = useQuery<Reemplazo>({
    queryKey: ['reemplazo', id],
    queryFn: () => reemplazoService.findOne(id),
    enabled: !!id,
  });

  return {
    reemplazo,
    isLoading,
    error,
    refetch,
  };
};
