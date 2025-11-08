// src/pages/ordenes/DevolucionesPageNew.tsx
import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useDevoluciones } from '../../modules/devoluciones/hooks/useDevoluciones';
import { DevolucionTabla } from './components/DevolucionTabla';
import { DevolucionFiltros } from './components/DevolucionFiltros';
import { AprobarDevolucionModal } from './components/AprobarDevolucionModal';
import { RechazarDevolucionModal } from './components/RechazarDevolucionModal';
import { EstadoDevolucion } from '../../modules/devoluciones/types/enums';
import type { EstadoDevolucion as EstadoDevolucionType } from '../../modules/devoluciones/types/enums';
import Pagination from '../../components/Pagination';

export const DevolucionesPageNew = () => {
  const {
    devoluciones,
    isLoading,
    error,
    aprobarDevolucion,
    rechazarDevolucion,
    completarDevolucion,
    cancelarDevolucion,
    isAprobando,
    isRechazando,
  } = useDevoluciones();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoDevolucionType | 'todos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalAprobar, setModalAprobar] = useState<{ isOpen: boolean; devolucionId: string }>({
    isOpen: false,
    devolucionId: '',
  });
  const [modalRechazar, setModalRechazar] = useState<{ isOpen: boolean; devolucionId: string }>({
    isOpen: false,
    devolucionId: '',
  });

  const itemsPerPage = 10;

  // Filtrar devoluciones
  const devolucionesFiltradas = devoluciones.filter((dev) => {
    const matchSearch =
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.orderId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = estadoFiltro === 'todos' || dev.estado === estadoFiltro;

    return matchSearch && matchEstado;
  });

  // Paginación
  const totalPages = Math.ceil(devolucionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const devolucionesPaginadas = devolucionesFiltradas.slice(startIndex, endIndex);

  // Handlers
  const handleAprobar = (id: string) => {
    setModalAprobar({ isOpen: true, devolucionId: id });
  };

  const handleRechazar = (id: string) => {
    setModalRechazar({ isOpen: true, devolucionId: id });
  };

  const handleConfirmarAprobar = async (data: import('../../modules/devoluciones/types/devolucion').AprobarDevolucionDto) => {
    try {
      const result = await aprobarDevolucion({ id: modalAprobar.devolucionId, data });
      alert(`Devolución aprobada exitosamente\nNúmero de autorización: ${result.instrucciones.numeroAutorizacion}`);
      setModalAprobar({ isOpen: false, devolucionId: '' });
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('Error al aprobar la devolución');
    }
  };

  const handleConfirmarRechazar = async (data: import('../../modules/devoluciones/types/devolucion').RechazarDevolucionDto) => {
    try {
      await rechazarDevolucion({ id: modalRechazar.devolucionId, data });
      alert('Devolución rechazada exitosamente');
      setModalRechazar({ isOpen: false, devolucionId: '' });
    } catch (error) {
      console.error('Error al rechazar:', error);
      alert('Error al rechazar la devolución');
    }
  };

  const handleCompletar = async (id: string) => {
    if (window.confirm('¿Está seguro de marcar esta devolución como completada?')) {
      try {
        await completarDevolucion(id);
        alert('Devolución completada exitosamente');
      } catch (error) {
        console.error('Error al completar:', error);
        alert('Error al completar la devolución');
      }
    }
  };

  const handleCancelar = async (id: string) => {
    if (window.confirm('¿Está seguro de cancelar esta devolución?')) {
      try {
        await cancelarDevolucion(id);
        alert('Devolución cancelada exitosamente');
      } catch (error) {
        console.error('Error al cancelar:', error);
        alert('Error al cancelar la devolución');
      }
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error al cargar devoluciones</p>
          <p className="text-sm">{error.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Devoluciones</h1>
          <p className="text-gray-600 mt-1">
            Administra y procesa las solicitudes de devolución de los clientes
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Devolución
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
          <p className="text-gray-600 text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-gray-800">
            {devoluciones.filter((d) => d.estado === EstadoDevolucion.PENDIENTE).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Procesando</p>
          <p className="text-2xl font-bold text-gray-800">
            {devoluciones.filter((d) => d.estado === EstadoDevolucion.PROCESANDO).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Completadas</p>
          <p className="text-2xl font-bold text-gray-800">
            {devoluciones.filter((d) => d.estado === EstadoDevolucion.COMPLETADA).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Canceladas</p>
          <p className="text-2xl font-bold text-gray-800">
            {devoluciones.filter((d) => d.estado === EstadoDevolucion.CANCELADA).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <DevolucionFiltros
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFiltro={estadoFiltro}
        onEstadoChange={setEstadoFiltro}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando devoluciones...</span>
        </div>
      )}

      {/* Tabla */}
      {!isLoading && (
        <>
          <DevolucionTabla
            devoluciones={devolucionesPaginadas}
            isLoading={isAprobando || isRechazando}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
            onCompletar={handleCompletar}
            onCancelar={handleCancelar}
          />

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Resultados */}
      {!isLoading && devolucionesFiltradas.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Mostrando {startIndex + 1} - {Math.min(endIndex, devolucionesFiltradas.length)} de{' '}
          {devolucionesFiltradas.length} devoluciones
        </div>
      )}

      {/* Modales */}
      <AprobarDevolucionModal
        isOpen={modalAprobar.isOpen}
        onClose={() => setModalAprobar({ isOpen: false, devolucionId: '' })}
        onConfirm={handleConfirmarAprobar}
        devolucionId={modalAprobar.devolucionId}
        isLoading={isAprobando}
      />

      <RechazarDevolucionModal
        isOpen={modalRechazar.isOpen}
        onClose={() => setModalRechazar({ isOpen: false, devolucionId: '' })}
        onConfirm={handleConfirmarRechazar}
        devolucionId={modalRechazar.devolucionId}
        isLoading={isRechazando}
      />
    </div>
  );
};

export default DevolucionesPageNew;
