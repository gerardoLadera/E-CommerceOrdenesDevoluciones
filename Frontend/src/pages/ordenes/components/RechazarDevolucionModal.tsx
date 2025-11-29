// src/pages/ordenes/components/RechazarDevolucionModal.tsx
import { useState } from 'react';
import Input from '../../../components/Input';
import type { RechazarDevolucionDto } from '../../../modules/devoluciones/types/devolucion';
import { X } from 'lucide-react';

interface RechazarDevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RechazarDevolucionDto) => Promise<void>;
  devolucionId: string;
  isLoading?: boolean;
}

export const RechazarDevolucionModal = ({
  isOpen,
  onClose,
  onConfirm,
  devolucionId,
  isLoading = false,
}: RechazarDevolucionModalProps) => {
  const [formData, setFormData] = useState<RechazarDevolucionDto>({
    adminId: 1, // TODO: Obtener del contexto de autenticación
    motivo: '',
    comentario: '',
  });

  const [errors, setErrors] = useState<{ motivo?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!formData.motivo.trim()) {
      setErrors({ motivo: 'El motivo es obligatorio' });
      return;
    }

    try {
      await onConfirm(formData);
      onClose();
      setFormData({
        adminId: 1,
        motivo: '',
        comentario: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error al rechazar devolución:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Rechazar Devolución</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              label="ID de Devolución"
              value={`${devolucionId.substring(0, 20)}...`}
              disabled 
            />
          </div>

          <div>
            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del Rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => {
                setFormData({ ...formData, motivo: e.target.value });
                setErrors({});
              }}
              className={`w-full px-3 py-2 border ${
                errors.motivo ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-red-500`}
              rows={3}
              placeholder="Especificar el motivo del rechazo..."
            />
            {errors.motivo && (
              <p className="text-red-500 text-sm mt-1">{errors.motivo}</p>
            )}
          </div>

          <div>
            <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 mb-2">
              Comentario Adicional (opcional)
            </label>
            <textarea
              id="comentario"
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Agregar comentarios adicionales..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Rechazando...' : 'Rechazar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
