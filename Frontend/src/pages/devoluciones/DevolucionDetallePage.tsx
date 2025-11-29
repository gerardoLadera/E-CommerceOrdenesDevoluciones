import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import CustomStatusDropdown from "../../components/StatusDropdown";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { devolucionService } from "../../modules/devoluciones/api/devolucionService";
import { EstadoDevolucion } from "../../modules/devoluciones/types/enums";
import { Loader2 } from "lucide-react";

// TIPOS DE DATOS
type Option = { value: string; label: string };
type StatusVariant = "neutral" | "success" | "danger" | "warning";

// CONSTANTES
const ESTADOS_DISPONIBLES = [
  EstadoDevolucion.PENDIENTE,
  EstadoDevolucion.PROCESANDO,
  EstadoDevolucion.COMPLETADA,
  EstadoDevolucion.CANCELADA,
];

const ESTADO_OPTIONS: Option[] = ESTADOS_DISPONIBLES.map(estado => ({
  value: estado,
  label: estado.charAt(0).toUpperCase() + estado.slice(1),
}));

const getEstadoStyle = (estado: string): string => {
  switch (estado) {
    case EstadoDevolucion.PENDIENTE:
      return "bg-yellow-500";
    case EstadoDevolucion.PROCESANDO:
      return "bg-blue-500";
    case EstadoDevolucion.COMPLETADA:
      return "bg-green-500";
    case EstadoDevolucion.CANCELADA:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusVariant = (ajuste: number): StatusVariant => {
  if (ajuste > 0) return "success";
  if (ajuste < 0) return "danger";
  return "neutral";
};

// COMPONENTES AUXILIARES
const DataRow: React.FC<{
  label: string;
  value: string | number;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ label, value, isFirst, isLast }) => {
  return (
    <div className="flex border-b border-gray-200 last:border-b-0">
      <div
        className={`w-1/3 p-2 text-sm font-semibold text-black 
        ${isFirst ? "rounded-tl-lg" : ""} ${isLast ? "rounded-bl-lg" : ""}`}
        style={{ backgroundColor: "#C9B35E" }}
      >
        {label}
      </div>
      <div
        className={`w-2/3 p-2 text-sm text-gray-800 bg-white 
        ${isFirst ? "rounded-tr-lg" : ""} ${isLast ? "rounded-br-lg" : ""}`}
      >
        {value}
      </div>
    </div>
  );
};

const ArticulosTable: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="mt-8 border border-gray-200 rounded-lg overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 table-auto">
      <thead className="bg-gray-50">
        <tr>
          {[
            "Tipo Acción",
            "ID Producto",
            "Cantidad",
            "Precio Compra",
            "Moneda",
            "Motivo",
          ].map(header => (
            <TableHeader
              key={header}
              label={header}
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-none bg-gray-50"
            />
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {items && items.length > 0 ? (
          items.map(item => (
            <tr key={item.id}>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {item.tipo_accion?.toUpperCase()}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {item.producto_id}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-none">
                {item.cantidad}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                ${item.precio_compra ? Number(item.precio_compra).toFixed(2) : '0.00'}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {item.moneda}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {item.motivo}
              </TableCell>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center py-4 text-gray-500 border border-gray-200">
              No hay items en esta devolución
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// PÁGINA PRINCIPAL
const DevolucionDetallePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Obtener datos de la devolución desde el backend
  const { data: devolucion, isLoading, isError } = useQuery({
    queryKey: ["devolucion", id],
    queryFn: () => devolucionService.findOne(id!),
    enabled: !!id,
  });

  const [currentEstado, setCurrentEstado] = useState<string>(
    devolucion?.estado || EstadoDevolucion.PENDIENTE
  );

  // Mutación para aprobar devolución
  const { mutate: aprobarMutation, isPending } = useMutation({
    mutationFn: (devId: string) => devolucionService.aprobar(devId, {
      adminId: 1,
      comentario: "Aprobado desde el panel de administración",
      metodoDevolucion: "envio_domicilio",
    }),
    onSuccess: () => {
      alert("Devolución aprobada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["devolucion", id] });
    },
    onError: (error: any) => {
      console.error("Error al aprobar la devolución:", error);
      alert(`Error al procesar la devolución: ${error.message}`);
    },
  });

  // Mutación para actualizar estado
  const { mutate: updateEstadoMutation } = useMutation({
    mutationFn: ({ devId, estado }: { devId: string; estado: string }) => 
      devolucionService.update(devId, { estado: estado as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devolucion", id] });
    },
    onError: (error: any) => {
      console.error("Error al actualizar estado:", error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleEstadoChange = (newValue: string) => {
    setCurrentEstado(newValue);

    if (newValue === EstadoDevolucion.PROCESANDO && id) {
      aprobarMutation(id);
    } else if (id) {
      updateEstadoMutation({ devId: id, estado: newValue });
    }
  };

  const handleVerOrdenGenerada = () => {
    if (devolucion?.orden_reemplazo_id) {
      navigate(`/ordenes/${devolucion.orden_reemplazo_id}`);
    } else {
      alert("No hay orden de reemplazo asociada");
    }
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="ml-4 text-lg">Cargando devolución...</p>
      </div>
    );
  }

  if (isError || !devolucion) {
    return (
      <div className="p-10 text-center text-xl text-red-600 font-bold">
        Error: Devolución con ID "{id}" no encontrada.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* TÍTULO Y ESTADO */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          Detalles de la devolución:
          <span className="ml-3 px-3 py-1 text-lg font-mono text-black bg-gray-300 rounded-lg">
            {devolucion.id}
          </span>
        </h1>
        <CustomStatusDropdown
          currentValue={currentEstado}
          options={ESTADO_OPTIONS}
          onChange={handleEstadoChange}
          getColorStyle={getEstadoStyle}
        />
      </div>

      {/* INFO BÁSICA */}
      <div className="flex space-x-4 mb-8 text-sm">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">ID de Orden:</span>
          <span className="font-semibold text-black">{devolucion.orderId}</span>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">Fecha Creación:</span>
          <span className="font-semibold text-black">
            {new Date(devolucion.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* GRID DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 1. DATOS DEL CLIENTE */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Datos del Cliente
          </h2>
          <DataRow label="Nombre" value="Cliente Ejemplo" isFirst />
          <DataRow label="Email" value="cliente@ejemplo.com" />
          <DataRow label="Teléfono" value="+51 999 999 999" />
          <DataRow label="Dirección" value="Av. Principal 123, Lima, Perú" isLast />
        </div>

        {/* 2. RESOLUCIÓN FINANCIERA */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Resolución Financiera
          </h2>
          {devolucion.reembolso ? (
            <>
              <DataRow label="Tipo" value="Reembolso" isFirst />
              <DataRow label="Monto" value={`$${Number(devolucion.reembolso.monto).toFixed(2)}`} />
              <DataRow label="Moneda" value={devolucion.reembolso.moneda} />
              <DataRow label="Estado" value={devolucion.reembolso.estado} />
              <DataRow label="Transacción ID" value={devolucion.reembolso.transaccion_id} />
              <DataRow
                label="Fecha Procesamiento"
                value={new Date(devolucion.reembolso.fecha_procesamiento).toLocaleDateString('es-ES')}
                isLast
              />
            </>
          ) : devolucion.reemplazos && devolucion.reemplazos.length > 0 ? (
            <>
              <DataRow label="Tipo" value="Reemplazo" isFirst />
              <DataRow label="Cantidad de Reemplazos" value={devolucion.reemplazos.length.toString()} />
              <DataRow label="Moneda" value={devolucion.reemplazos[0]?.moneda || 'N/A'} isLast />
            </>
          ) : (
            <p className="text-gray-500 text-sm">No hay resolución financiera registrada.</p>
          )}
        </div>

        {/* 3. RESUMEN DE ITEMS */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Resumen de Items
          </h2>
          <DataRow label="Total Items" value={devolucion.items?.length.toString() || '0'} isFirst />
          <DataRow 
            label="Cantidad Total" 
            value={devolucion.items?.reduce((sum, item) => sum + item.cantidad, 0).toString() || '0'} 
          />
          <DataRow 
            label="Monto Total" 
            value={`$${devolucion.items?.reduce((sum, item) => sum + (Number(item.precio_compra) * item.cantidad), 0).toFixed(2) || '0.00'}`}
            isLast
          />
        </div>
      </div>

      {/* 3. HISTORIAL DE DEVOLUCIÓN */}
      {devolucion.historial && devolucion.historial.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-bold text-gray-800 p-4 border-b">
            Historial de la Devolución
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-xs font-bold text-black uppercase" style={{ backgroundColor: "#C9B35E" }}>
                  <th className="p-3 text-left border-r border-white">Fecha</th>
                  <th className="p-3 text-left border-r border-white">Estado Anterior</th>
                  <th className="p-3 text-left border-r border-white">Estado Nuevo</th>
                  <th className="p-3 text-left border-r border-white">Modificado Por</th>
                  <th className="p-3 text-left">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {devolucion.historial.map((hist, index) => (
                  <tr
                    key={hist.id}
                    className={`text-sm border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="p-3 text-gray-700">
                      {new Date(hist.fecha_creacion).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800">
                        {hist.estado_anterior || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoStyle(hist.estado_nuevo)} text-white`}>
                        {hist.estado_nuevo}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{hist.modificado_por_id || 'Sistema'}</td>
                    <td className="p-3 text-gray-600">{hist.comentario || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-8 text-center">
          <p className="text-gray-500">No hay historial registrado para esta devolución.</p>
        </div>
      )}

      {/* TABLA DE ITEMS */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Items de la Devolución
      </h2>
      <ArticulosTable items={devolucion.items || []} />

      {/* BOTONES */}
      <div className="flex justify-end gap-4 p-4 border-t border-gray-200 mt-8">
        <Button
          text="VOLVER"
          onClick={() => navigate('/ordenes/devoluciones')}
          className="px-4 py-2 text-sm font-semibold bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        />
        {devolucion.orden_reemplazo_id && (
          <Button
            text="VER ORDEN GENERADA"
            onClick={handleVerOrdenGenerada}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:bg-green-700 transition"
            style={{ backgroundColor: "#332F23" }}
          />
        )}
      </div>
    </div>
  );
};

export default DevolucionDetallePage;
