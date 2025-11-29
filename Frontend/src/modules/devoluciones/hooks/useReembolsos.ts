// src/modules/devoluciones/hooks/useReembolsos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reembolsoService } from '../api/reembolsoService';
import type {
  Reembolso,
  CreateReembolsoDto,
  UpdateReembolsoDto,
} from '../types/devolucion';

export const useReembolsos = () => {
  const queryClient = useQueryClient();

  const {
    data: reembolsos = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Reembolso[]>({
    queryKey: ['reembolsos'],
    queryFn: reembolsoService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReembolsoDto) => reembolsoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reembolsos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReembolsoDto }) =>
      reembolsoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reembolsos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reembolsoService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reembolsos'] });
    },
  });

  return {
    reembolsos,
    isLoading,
    error,
    refetch,
    createReembolso: createMutation.mutateAsync,
    updateReembolso: updateMutation.mutateAsync,
    eliminarReembolso: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useReembolso = (id: string) => {
  const {
    data: reembolso,
    isLoading,
    error,
    refetch,
  } = useQuery<Reembolso>({
    queryKey: ['reembolso', id],
    queryFn: () => reembolsoService.findOne(id),
    enabled: !!id,
  });

  return {
    reembolso,
    isLoading,
    error,
    refetch,
  };
};
