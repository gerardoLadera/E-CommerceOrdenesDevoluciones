import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Componentes UI
import Button from "../../components/Button";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import CustomStatusDropdown from "../../components/StatusDropdown";

// API y Tipos
import {
  getDevolucionById,
  aprobarDevolucion,
} from "../../modules/ordenes/api/devoluciones";
import type {
  DetalleDevolucion,
  ArticuloDevuelto,
} from "../../modules/ordenes/types/devolucion";

// --- CONFIGURACIÓN DE ESTADOS Y ESTILOS ---
const ESTADO_OPTIONS = [
  { value: "SOLICITADO", label: "SOLICITADO" },
  { value: "APROBADO", label: "APROBADO" },
  { value: "RECHAZADO", label: "RECHAZADO" },
];

const getEstadoStyle = (estado: string): string => {
  switch (estado?.toUpperCase()) {
    case "PENDIENTE":
    case "SOLICITADO":
      return "bg-yellow-500";
    case "APROBADO":
    case "COMPLETADA":
      return "bg-green-500";
    case "RECHAZADO":
    case "ERROR_REEMBOLSO":
      return "bg-red-500";
    case "PROCESANDO":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusVariant = (ajuste: number) => {
  if (ajuste > 0) return "success";
  if (ajuste < 0) return "danger";
  return "neutral";
};

const calcularMontoTotalItem = (item: ArticuloDevuelto): number => {
  // Convertir todos los valores monetarios/cantidad a números
  const precioDevuelto = Number(item.precio_unitario_dev) || 0;
  const cantidadDevuelta = Number(item.cantidad_dev) || 0;
  const precioNuevo = Number(item.precio_unitario_new) || 0;
  const cantidadNueva = Number(item.cantidad_new) || 0;

  const valorDevuelto = cantidadDevuelta * precioDevuelto * -1;
  const valorNuevo = cantidadNueva * (precioNuevo - precioDevuelto);

  if (item.tipo_accion?.toLowerCase() === "reembolso") {
    return valorDevuelto;
  }

  if (item.tipo_accion?.toLowerCase() === "reemplazo") {
    return valorNuevo; // Ajuste neto
  }
  return 0;
};

// Función de formato de fecha/hora
const formatHistoricalDate = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return isoDateString; // Devuelve la cadena original si es inválida
    }
    const datePart = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Formato de 24 horas
    });
    return `${datePart}, ${timePart}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoDateString;
  }
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
const ArticulosTable: React.FC<{ articulos: ArticuloDevuelto[] }> = ({
  articulos,
}) => (
  <div className="mt-8 border border-gray-200 rounded-lg overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 table-auto">
      <thead className="bg-gray-50">
        <tr>
          {[
            "Acción solicitada",
            "ID del artículo devuelto",
            "Nombre del artículo devuelto",
            "Precio pagado (S/.)",
            "Cantidad devuelta",
            "Cantidad nueva",
            "Motivo",
            "ID del artículo nuevo",
            "Nombre del artículo nuevo",
            "Precio nuevo (S/.)",
            "Monto total(S/.)",
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
        {articulos.map(articulo => {
          // [FIX 2 - Scope]: Se calcula montoAjuste dentro del map para que exista en el ámbito
          const montoAjuste = calcularMontoTotalItem(articulo);

          return (
            <tr key={articulo.id}>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none uppercase font-bold">
                {articulo.tipo_accion}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none ">
                {articulo.producto_id_dev}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.producto_id_dev}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                S/ {Number(articulo.precio_unitario_dev).toFixed(2)}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.cantidad_dev}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.cantidad_new}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.motivo}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none ">
                {articulo.producto_id_new || "N/A"}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.producto_id_new || "N/A"}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.precio_unitario_new
                  ? `${Number(articulo.precio_unitario_new).toFixed(2)}`
                  : "N/A"}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none font-bold">
                {/* [FIX 3 - Propiedad]: Cambiado 'status' (incorrecto) por 'label' (probable prop) */}
                <StatusBadge
                  label={`${montoAjuste.toFixed(2)}`}
                  variant={getStatusVariant(montoAjuste)}
                  //isCurrency={true}
                />
              </TableCell>
            </tr>
          );
        })}
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
  const {
    data: devolucion,
    isLoading,
    isError,
  } = useQuery<DetalleDevolucion>({
    queryKey: ["devolucion", id],
    queryFn: () => getDevolucionById(id!),
    enabled: !!id,
  });

  const [currentEstado, setCurrentEstado] = useState<string>("");

  useEffect(() => {
    if (devolucion) {
      const estadoVisual =
        devolucion.estado.toUpperCase() === "PENDIENTE"
          ? "SOLICITADO"
          : devolucion.estado.toUpperCase();
      setCurrentEstado(estadoVisual);
    }
  }, [devolucion]);

  // 2. Mutación para Aprobar
  const { mutate: aprobarDevolucionMutation, isPending: isApproving } =
    useMutation({
      mutationFn: aprobarDevolucion,
      onSuccess: () => {
        console.log(
          "¡Éxito! La devolución ha sido aprobada y el reembolso se está procesando."
        );
        queryClient.invalidateQueries({ queryKey: ["devolucion", id] });
      },
      onError: (error: any) => {
        console.error("Error al aprobar:", error);
        console.log(
          `Error: ${error.response?.data?.message || "Error inesperado"}`
        );
        if (devolucion)
          setCurrentEstado(
            devolucion.estado.toUpperCase() === "PENDIENTE"
              ? "SOLICITADO"
              : devolucion.estado.toUpperCase()
          );
      },
    });

  const handleEstadoChange = (newValue: string) => {
    setCurrentEstado(newValue);
    if (
      newValue === "APROBADO" &&
      id &&
      (devolucion?.estado === "pendiente" ||
        devolucion?.estado === "SOLICITADO")
    ) {
      aprobarDevolucionMutation(id);
    }
  };

  const handleVerOrdenGenerada = () => {
    if (devolucion?.orderId) {
      navigate(`/ordenes/${devolucion.orderId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !devolucion) {
    return (
      <div className="p-10 text-center text-xl text-red-600 font-bold">
        Error al cargar la devolución.
      </div>
    );
  }

  // 1. Filtrar los items por acción
  const itemsReembolso = devolucion.items.filter(
    item => item.tipo_accion?.toLowerCase() === "reembolso"
  );
  const itemsReemplazo = devolucion.items.filter(
    item => item.tipo_accion?.toLowerCase() === "reemplazo"
  );
  // 2. Monto Total de Reembolsos (Suma de montos negativos que salen al cliente)
  const montoTotalReembolso = itemsReembolso.reduce(
    (sum, item) => sum + calcularMontoTotalItem(item) * -1,
    0
  );
  // 3. Monto Total de Reemplazos (Suma de los ajustes netos: + o -)
  const montoTotalReemplazo = itemsReemplazo.reduce(
    (sum, item) => sum + calcularMontoTotalItem(item),
    0
  );
  // 4. Total de Items Nuevos para Reemplazo (Suma de cantidad_new)
  const totalItemsReemplazo = itemsReemplazo.reduce(
    (sum, item) => sum + (Number(item.cantidad_new) || 0),
    0
  );

  const clienteNombre = (devolucion as any).nombreCliente || "Ver en Orden";

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          Detalles de la devolución:
          <span className="ml-3 px-3 py-1 text-lg font-mono text-black bg-gray-300 rounded-lg">
            {devolucion.codDevolucion || devolucion.id}
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
          <span className="font-semibold text-gray-600">
            ID Orden Original:
          </span>
          <span className="font-semibold text-black">
            {devolucion.codOrden || devolucion.orderId}
          </span>
        </div>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">Fecha Solicitud:</span>
          <span className="font-semibold text-black">
            {new Date(
              devolucion.historial[devolucion.historial.length - 1]
                ?.fecha_creacion || new Date()
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* GRID DE 3 COLUMNAS (DISEÑO DE GERARDO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* COLUMNA 1: DATOS DEL CLIENTE */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2 border-b">
            Datos del cliente
          </h2>
          <DataRow
            label="Nombres y apellidos"
            value={devolucion.datosCliente?.nombres || "N/A"}
            isFirst
          />
          <DataRow
            label="Teléfono"
            value={devolucion.datosCliente?.telefono || "N/A"}
            isLast
          />
          <DataRow
            label="Direccion"
            value={devolucion.datosCliente?.direccion || "N/A"}
          />
        </div>

        {/* COLUMNA 2: Resumen de reembolso */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2 border-b">
            Resumen de reembolso
          </h2>
          <DataRow
            label="Monto Total"
            value={`S/ ${montoTotalReembolso.toFixed(2)}`}
            isFirst
          />
          <DataRow
            label="ID Reembolso"
            value={(devolucion as any).reembolso_id || "-"}
          />
          <DataRow
            label="Estado Pago"
            value={(devolucion as any).reembolso?.estado || "-"}
          />
          <DataRow
            label="Transacción"
            value={(devolucion as any).reembolso?.transaccion_id || "-"}
            isLast
          />
        </div>

        {/* COLUMNA 3 : Resumen de reemplazo*/}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2 border-b">
            Resumen de reemplazo
          </h2>
          <DataRow
            label="ID orden nueva"
            value={(devolucion as any).orden_reemplazo_id || "-"}
            isFirst
          />
          <DataRow label="Total de items" value={totalItemsReemplazo || "-"} />
          <DataRow
            label="Monto toal"
            value={`S/ ${montoTotalReemplazo.toFixed(2)}` || "-"}
          />
        </div>
      </div>

      {/* 3. Historial de la devolución (Movido fuera del grid para ser un bloque de ancho completo) */}
      <div className="w-full max-w-lg ml-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-black p-3">
            Historial de estados:
          </h2>

          <div
            className="grid grid-cols-4 rounded-t-lg text-xs font-bold text-black uppercase"
            style={{ backgroundColor: "#C9B35E" }}
          >
            <div className="p-2 border-r border-white">Fecha y Hora</div>
            <div className="p-2 border-r border-white">Estado anterior</div>
            <div className="p-2 border-r border-white">Estado actual</div>
            <div className="p-2">Modificado Por</div>
          </div>

          {/* ITEMS DEL HISTORIAL */}
          {devolucion.historial.map((hist, index) => (
            <div
              key={index}
              className={`grid grid-cols-4 text-sm border-b border-gray-100 ${
                index === devolucion.historial.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <div className="p-2 text-gray-600">
                {formatHistoricalDate(hist.fecha_creacion)}
              </div>
              <div className="p-2 text-gray-800 font-medium">
                {hist.estado_anterior || "-"}
              </div>
              <div className="p-2 text-gray-800 font-medium">
                {hist.estado_nuevo || "-"}
              </div>
              <div className="p-2 text-gray-600">
                {hist.modificado_por_id ?? "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLA DE ARTÍCULOS */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Artículos de la Devolución
      </h2>
      <ArticulosTable articulos={devolucion.items} />
    </div>
  );
};

export default DevolucionDetallePage;
