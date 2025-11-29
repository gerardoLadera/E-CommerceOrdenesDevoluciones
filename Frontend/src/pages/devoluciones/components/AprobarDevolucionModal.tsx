// src/pages/ordenes/components/AprobarDevolucionModal.tsx
import { useState } from 'react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Select from '../../../components/Select';
import { MetodoDevolucion } from '../../../modules/devoluciones/types/enums';
import type { AprobarDevolucionDto } from '../../../modules/devoluciones/types/devolucion';
import { X } from 'lucide-react';

interface AprobarDevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AprobarDevolucionDto) => Promise<void>;
  devolucionId: string;
  isLoading?: boolean;
}

export const AprobarDevolucionModal = ({
  isOpen,
  onClose,
  onConfirm,
  devolucionId,
  isLoading = false,
}: AprobarDevolucionModalProps) => {
  const [formData, setFormData] = useState<AprobarDevolucionDto>({
    adminId: 1, // TODO: Obtener del contexto de autenticación
    comentario: '',
    metodoDevolucion: MetodoDevolucion.ENVIO_DOMICILIO,
  });

  const metodoOptions = [
    { value: MetodoDevolucion.ENVIO_DOMICILIO, label: 'Envío a Domicilio' },
    { value: MetodoDevolucion.RECOLECCION, label: 'Recolección' },
    { value: MetodoDevolucion.PUNTO_ENTREGA, label: 'Punto de Entrega' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onConfirm(formData);
      onClose();
      setFormData({
        adminId: 1,
        comentario: '',
        metodoDevolucion: MetodoDevolucion.ENVIO_DOMICILIO,
      });
    } catch (error) {
      console.error('Error al aprobar devolución:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Aprobar Devolución</h2>
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
            <Select
              label="Método de Devolución"
              value={formData.metodoDevolucion}
              onChange={(e) =>
                setFormData({ ...formData, metodoDevolucion: e.target.value })
              }
              options={metodoOptions}
            />
          </div>

          <div>
            <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Aprobando...' : 'Aprobar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
