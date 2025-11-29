// src/pages/ordenes/components/CrearDevolucionModal.tsx
import { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import type { CreateDevolucionDto } from '../../../modules/devoluciones/types/devolucion';
import { EstadoDevolucion } from '../../../modules/devoluciones/types/enums';

interface CrearDevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CreateDevolucionDto) => Promise<void>;
  isLoading?: boolean;
}

export const CrearDevolucionModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CrearDevolucionModalProps) => {
  const [formData, setFormData] = useState<CreateDevolucionDto>({
    orderId: '',
    estado: EstadoDevolucion.PENDIENTE,
    fecha_procesamiento: '',
    orden_reemplazo_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const newErrors: Record<string, string> = {};

    if (!formData.orderId.trim()) {
      newErrors.orderId = 'El ID de orden es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Limpiar campos opcionales vacíos
    const dataToSend: CreateDevolucionDto = {
      orderId: formData.orderId.trim(),
      estado: formData.estado,
    };

    if (formData.fecha_procesamiento) {
      dataToSend.fecha_procesamiento = formData.fecha_procesamiento;
    }
    if (formData.orden_reemplazo_id?.trim()) {
      dataToSend.orden_reemplazo_id = formData.orden_reemplazo_id.trim();
    }

    try {
      await onConfirm(dataToSend);
      handleClose();
    } catch (error) {
      console.error('Error en el modal:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      orderId: '',
      estado: EstadoDevolucion.PENDIENTE,
      fecha_procesamiento: '',
      orden_reemplazo_id: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateDevolucionDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Devolución</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ID de Orden - Requerido */}
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              ID de Orden <span className="text-red-500">*</span>
            </label>
            <input
              id="orderId"
              type="text"
              value={formData.orderId}
              onChange={(e) => handleChange('orderId', e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                errors.orderId ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ej: order-123-456"
            />
            {errors.orderId && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.orderId}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ingrese el ID de la orden para la cual se crea la devolución
            </p>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado Inicial
            </label>
            <select
              id="estado"
              value={formData.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value={EstadoDevolucion.PENDIENTE}>Pendiente</option>
              <option value={EstadoDevolucion.PROCESANDO}>Procesando</option>
              <option value={EstadoDevolucion.COMPLETADA}>Completada</option>
              <option value={EstadoDevolucion.CANCELADA}>Cancelada</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Por defecto se crea como "Pendiente"
            </p>
          </div>

          {/* Fecha de Procesamiento - Opcional */}
          <div>
            <label htmlFor="fechaProcesamiento" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Procesamiento <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              id="fechaProcesamiento"
              type="datetime-local"
              value={formData.fecha_procesamiento}
              onChange={(e) => handleChange('fecha_procesamiento', e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si no se especifica, se usará la fecha actual al procesar
            </p>
          </div>

          {/* Campos Opcionales Avanzados */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Opciones Avanzadas (Opcional)
            </h3>

            {/* Orden de Reemplazo ID */}
            <div className="mb-4">
              <label htmlFor="ordenReemplazoId" className="block text-sm font-medium text-gray-700 mb-2">
                ID de Orden de Reemplazo
              </label>
              <input
                id="ordenReemplazoId"
                type="text"
                value={formData.orden_reemplazo_id}
                onChange={(e) => handleChange('orden_reemplazo_id', e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Ej: replacement-order-789"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Devolución'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
