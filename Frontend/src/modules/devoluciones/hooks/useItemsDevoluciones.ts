// src/modules/devoluciones/hooks/useItemsDevoluciones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemDevolucionService } from '../api/itemDevolucionService';
import type {
  ItemDevolucion,
  CreateItemsDevolucionDto,
  UpdateItemsDevolucionDto,
} from '../types/devolucion';

export const useItemsDevoluciones = () => {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ItemDevolucion[]>({
    queryKey: ['items-devolucion'],
    queryFn: itemDevolucionService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateItemsDevolucionDto) => itemDevolucionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-devolucion'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemsDevolucionDto }) =>
      itemDevolucionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-devolucion'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemDevolucionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-devolucion'] });
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });

  return {
    items,
    isLoading,
    error,
    refetch,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    eliminarItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useItemDevolucion = (id: string) => {
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery<ItemDevolucion>({
    queryKey: ['item-devolucion', id],
    queryFn: () => itemDevolucionService.findOne(id),
    enabled: !!id,
  });

  return {
    item,
    isLoading,
    error,
    refetch,
  };
};
