import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Componentes UI
import Button from "../../components/Button";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import CustomStatusDropdown from "../../components/StatusDropdown";

// API y Tipos
import { getDevolucionById, aprobarDevolucion } from "../../modules/ordenes/api/devoluciones";
import type { DetalleDevolucion, ArticuloDevuelto } from "../../modules/ordenes/types/devolucion";

// --- CONFIGURACIÓN DE ESTADOS Y ESTILOS ---
const ESTADO_OPTIONS = [
  { value: "SOLICITADO", label: "SOLICITADO" },
  { value: "APROBADO", label: "APROBADO" },
  { value: "RECHAZADO", label: "RECHAZADO" },
];

const getEstadoStyle = (estado: string): string => {
  switch (estado?.toUpperCase()) {
    case "PENDIENTE":
    case "SOLICITADO": return "bg-yellow-500";
    case "APROBADO":
    case "COMPLETADA": return "bg-green-500";
    case "RECHAZADO":
    case "ERROR_REEMBOLSO": return "bg-red-500";
    case "PROCESANDO": return "bg-blue-500";
    default: return "bg-gray-500";
  }
};

const getStatusVariant = (ajuste: number) => {
  if (ajuste > 0) return "success";
  if (ajuste < 0) return "danger";
  return "neutral";
};

// --- COMPONENTE AUXILIAR: DATA ROW (Para el diseño de rejilla) ---
const DataRow: React.FC<{
  label: string;
  value: string | number;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ label, value, isFirst, isLast }) => {
  return (
    <div className="flex border-b border-gray-200 last:border-b-0">
      <div
        className={`w-1/3 p-2 text-sm font-semibold text-black ${isFirst ? "rounded-tl-lg" : ""} ${isLast ? "rounded-bl-lg" : ""}`}
        style={{ backgroundColor: "#C9B35E" }}
      >
        {label}
      </div>
      <div
        className={`w-2/3 p-2 text-sm text-gray-800 bg-white ${isFirst ? "rounded-tr-lg" : ""} ${isLast ? "rounded-br-lg" : ""}`}
      >
        {value || "N/A"}
      </div>
    </div>
  );
};

// --- COMPONENTE AUXILIAR: TABLA DE ARTÍCULOS ---
const ArticulosTable: React.FC<{ articulos: ArticuloDevuelto[] }> = ({ articulos }) => (
  <div className="mt-8 border border-gray-200 rounded-lg overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 table-auto">
      <thead className="bg-gray-50">
        <tr>
          {["ID Producto", "Acción", "Cantidad", "Precio Unit.", "Motivo", "Estado Stock"].map((header) => (
            <TableHeader
              key={header}
              label={header}
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-none bg-gray-50"
            />
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {articulos.map((articulo) => (
          <tr key={articulo.id}>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">{articulo.producto_id}</TableCell>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none uppercase font-bold">{articulo.tipo_accion}</TableCell>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">{articulo.cantidad}</TableCell>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">S/ {Number(articulo.precio_compra).toFixed(2)}</TableCell>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">{articulo.motivo}</TableCell>
            <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
               <StatusBadge label="Recibido" variant="success" />
            </TableCell>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- PÁGINA PRINCIPAL ---
const DevolucionDetallePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // 1. Cargar Datos Reales
  const { data: devolucion, isLoading, isError } = useQuery({
    queryKey: ["devolucion", id],
    queryFn: () => getDevolucionById(id!),
    enabled: !!id,
  });

  const [currentEstado, setCurrentEstado] = useState<string>("");

  useEffect(() => {
    if (devolucion) {
      const estadoVisual = devolucion.estado.toUpperCase() === 'PENDIENTE' ? 'SOLICITADO' : devolucion.estado.toUpperCase();
      setCurrentEstado(estadoVisual);
    }
  }, [devolucion]);

  // 2. Mutación para Aprobar
  const { mutate: aprobarDevolucionMutation, isPending: isApproving } = useMutation({
    mutationFn: aprobarDevolucion,
    onSuccess: () => {
      alert("¡Éxito! La devolución ha sido aprobada y el reembolso se está procesando.");
      queryClient.invalidateQueries({ queryKey: ["devolucion", id] });
    },
    onError: (error: any) => {
      console.error("Error al aprobar:", error);
      alert(`Error: ${error.response?.data?.message || "Error inesperado"}`);
      if (devolucion) setCurrentEstado(devolucion.estado.toUpperCase() === 'PENDIENTE' ? 'SOLICITADO' : devolucion.estado.toUpperCase());
    },
  });

  const handleEstadoChange = (newValue: string) => {
    setCurrentEstado(newValue);
    if (newValue === "APROBADO" && id && (devolucion?.estado === "pendiente" || devolucion?.estado === "SOLICITADO")) {
      aprobarDevolucionMutation(id);
    }
  };

  const handleVerOrdenGenerada = () => {
    if (devolucion?.orderId) {
        navigate(`/ordenes/${devolucion.orderId}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>;
  }

  if (isError || !devolucion) {
    return <div className="p-10 text-center text-xl text-red-600 font-bold">Error al cargar la devolución.</div>;
  }

  // Cálculos para la UI (si el backend no los manda procesados)
  const montoTotal = devolucion.items.reduce((sum, item) => sum + (Number(item.precio_compra) * item.cantidad), 0);
  // Nota: Para mostrar datos del cliente aquí, necesitas que `getDevolucionById` (findOne backend) también llame a orders-query.
  // Por ahora mostraré placeholders o datos si existen, para que el diseño no se rompa.
  const clienteNombre = (devolucion as any).nombreCliente || "Ver en Orden"; 

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          Detalles de la devolución:
          <span className="ml-3 px-3 py-1 text-lg font-mono text-black bg-gray-300 rounded-lg">
            {devolucion.id.substring(0, 8)}...
          </span>
        </h1>
        <div className={isApproving ? "opacity-50 cursor-not-allowed" : ""}>
          <CustomStatusDropdown
            currentValue={currentEstado}
            options={ESTADO_OPTIONS}
            onChange={handleEstadoChange}
            getColorStyle={getEstadoStyle}
          />
        </div>
      </div>

      {/* SUB-HEADER INFO */}
      <div className="flex space-x-4 mb-8 text-sm">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">ID Orden Original:</span>
          <span className="font-semibold text-black">{devolucion.orderId}</span>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">Fecha Solicitud:</span>
          <span className="font-semibold text-black">{new Date(devolucion.historial[devolucion.historial.length - 1]?.fecha_creacion || new Date()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* GRID DE 3 COLUMNAS (DISEÑO DE GERARDO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* COLUMNA 1: DATOS DEL CLIENTE */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2 border-b">Datos del cliente</h2>
          <DataRow label="Nombre" value={clienteNombre} isFirst />
          <DataRow label="ID Cliente" value={(devolucion as any).clienteId || "N/A"} />
          <DataRow label="Email" value="Consultar en Orden" />
          <DataRow label="Teléfono" value="Consultar en Orden" isLast />
        </div>

        {/* COLUMNA 2: RESOLUCIÓN FINANCIERA */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2 border-b">Resolución Financiera</h2>
          <DataRow label="Monto Total" value={`S/ ${montoTotal.toFixed(2)}`} isFirst />
          <DataRow label="ID Reembolso" value={(devolucion as any).reembolso_id || "Pendiente"} />
          <DataRow label="Estado Pago" value={(devolucion as any).reembolso?.estado || "Pendiente"} />
          <DataRow label="Transacción" value={(devolucion as any).reembolso?.transaccion_id || "N/A"} isLast />
        </div>

        {/* COLUMNA 3: HISTORIAL */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-black p-3 border-b">Historial</h2>
          <div className="grid grid-cols-3 rounded-t-lg text-xs font-bold text-black uppercase bg-[#C9B35E]">
            <div className="p-2 border-r border-white">Fecha</div>
            <div className="p-2 border-r border-white">Estado</div>
            <div className="p-2">Usuario</div>
          </div>
          {devolucion.historial.map((hist, index) => (
            <div key={index} className="grid grid-cols-3 text-xs border-b border-gray-100 last:rounded-b-lg">
              <div className="p-2 text-gray-600">{new Date(hist.fecha_creacion).toLocaleDateString()} {new Date(hist.fecha_creacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              <div className="p-2 text-gray-800 font-medium">{hist.estado_nuevo}</div>
              <div className="p-2 text-gray-600">Sys/Admin</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLA DE ARTÍCULOS */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Artículos de la Devolución</h2>
      <ArticulosTable articulos={devolucion.items} />

      {/* BOTÓN DE ACCIÓN */}
      <div className="flex justify-end p-4 mt-6 border-t border-gray-200">
        <Button
          text="VER ORDEN ORIGINAL"
          onClick={handleVerOrdenGenerada}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:bg-green-700 transition"
          style={{ backgroundColor: "#332F23" }}
        />
      </div>
    </div>
  );
};

export default DevolucionDetallePage;