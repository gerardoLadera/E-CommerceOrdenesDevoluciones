import React, { useState , useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Button from "../../components/Button";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import CustomStatusDropdown from "../../components/StatusDropdown";
import { getDevolucionById, aprobarDevolucion } from "../../modules/ordenes/api/devoluciones"; 

// TIPOS DE DATOS
type Option = { value: string; label: string };
type EstadoDevolucion = "SOLICITADO" | "APROBADO" | "RECHAZADO" | "PROCESANDO" | "COMPLETADA" | "ERROR_REEMBOLSO";
type StatusVariant = "neutral" | "success" | "danger" | "warning";


const ESTADO_OPTIONS: Option[] = [
  { value: "SOLICITADO", label: "SOLICITADO" },
  { value: "APROBADO", label: "APROBADO" },
  { value: "RECHAZADO", label: "RECHAZADO" },
];

const getEstadoStyle = (estado: string): string => {
  switch (estado?.toUpperCase()) { // Usamos toUpperCase para ser consistentes
    case "PENDIENTE": // El backend usa 'pendiente' en minúsculas
    case "SOLICITADO": return "bg-yellow-500";
    case "APROBADO":
    case "COMPLETADA": return "bg-green-500";
    case "RECHAZADO":
    case "ERROR_REEMBOLSO": return "bg-red-500";
    case "PROCESANDO": return "bg-blue-500";
    default: return "bg-gray-500";
  }
};

const getStatusVariant = (ajuste: number): StatusVariant => {
  if (ajuste > 0) return "success";
  if (ajuste < 0) return "danger";
  return "neutral";
};

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
        {label}{" "}
      </div>
      <div
        className={`w-2/3 p-2 text-sm text-gray-800 bg-white 
        ${isFirst ? "rounded-tr-lg" : ""} ${isLast ? "rounded-br-lg" : ""}`}
      >
        {value}{" "}
      </div>{" "}
    </div>
  );
};

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
            "Precio pagado (unid)",
            "Cantidad devuelta",
            "Motivo",
            "ID del artículo nuevo",
            "Nombre del artículo nuevo",
            "Precio nuevo (unid)",
            "Ajuste saldo",
            "Razón de ajuste",
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
          const ajusteVariant = getStatusVariant(articulo.ajusteSaldo);

          const ajusteSaldoClassName =
            ajusteVariant === "success"
              ? "text-green-600 font-semibold"
              : ajusteVariant === "danger"
                ? "text-red-600 font-semibold"
                : "text-gray-600 font-semibold";

          return (
            <tr key={articulo.id}>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.accionSolicitada}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {articulo.idArticuloDevuelto}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.nombreArticuloDevuelto}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {articulo.precioPagadoUnidad.toFixed(2)}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-none">
                {articulo.cantidadDevuelta}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.motivo}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {articulo.idArticuloNuevo}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-gray-900 border-none">
                {articulo.nombreArticuloNuevo}
              </TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-none">
                {articulo.precioUnidadNuevo.toFixed(2)}
              </TableCell>

              <TableCell
                className={`px-3 py-2 whitespace-nowrap text-sm border-none ${ajusteSaldoClassName}`}
              >
                {articulo.ajusteSaldo > 0 ? "+" : ""}
                {articulo.ajusteSaldo.toFixed(2)}{" "}
              </TableCell>

              <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-center font-bold border-none">
                <StatusBadge
                  label={articulo.razonAjuste}
                  variant={ajusteVariant}
                  className={
                    ajusteVariant === "success"
                      ? "bg-green-100 text-green-600"
                      : ajusteVariant === "danger"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"
                  }
                />
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// PÁGINA PRINCIPAL

const DevolucionDetallePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const queryClient = useQueryClient();

  const { data: devolucion, isLoading, isError } = useQuery({
    queryKey: ["devolucion", id],
    queryFn: () => getDevolucionById(id!), // Llama a la API para obtener los datos
    enabled: !!id, // Solo ejecuta la query si el ID existe
  });

  // Estado local para manejar el valor del dropdown
  const [currentEstado, setCurrentEstado] = useState<string>("");

  useEffect(() => {
    if (devolucion) {
      // El backend devuelve 'pendiente', lo convertimos a 'SOLICITADO' para el dropdown
      const estadoVisual = devolucion.estado.toUpperCase() === 'PENDIENTE' ? 'SOLICITADO' : devolucion.estado.toUpperCase();
      setCurrentEstado(estadoVisual);
    }
  }, [devolucion]);

  // --- MUTACIÓN PARA APROBAR LA DEVOLUCIÓN ---
  const { mutate: aprobarDevolucionMutation, isPending: isApproving } = useMutation({
    mutationFn: aprobarDevolucion,
    onSuccess: () => {
      alert("¡Éxito! La devolución ha sido aprobada y el reembolso se está procesando.");
      queryClient.invalidateQueries({ queryKey: ["devolucion", id] });
    },
    onError: (error: any) => {
      console.error("Error al aprobar la devolución:", error);
      const errorMessage = error.response?.data?.message || "Ocurrió un error inesperado.";
      alert(`Error: ${errorMessage}`);
      if (devolucion) setCurrentEstado(devolucion.estado.toUpperCase());
    },
  });

  const handleEstadoChange = (newValue: string) => {
    setCurrentEstado(newValue);
    // Aseguramos que el estado original sea 'pendiente' (como lo envía el backend)
    if (newValue === "APROBADO" && id && devolucion?.estado === "pendiente") {
      aprobarDevolucionMutation(id);
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
    return <div className="p-10 text-center text-xl text-red-600 font-bold">Error al cargar la devolución.</div>;
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Detalles de la devolución: <span className="font-mono text-black bg-gray-200 p-2 rounded">{devolucion.id}</span>
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

      <div className="flex space-x-4 mb-8 text-sm">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">ID de Orden Original:</span>
          <span className="font-semibold text-black">{devolucion.orderId}</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Artículos de la Devolución/Reemplazo
      </h2>
      
      {/* --- CORRECCIÓN 3: Añadir tipado explícito a los parámetros del map --- */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">Items</h3>
        {devolucion.items.map((item: ArticuloDevuelto) => (
          <div key={item.id} className="border-b p-2">
            <p>ID Producto: {item.producto_id}</p>
            <p>Acción: {item.tipo_accion}</p>
            <p>Cantidad: {item.cantidad}</p>
            <p>Precio: {item.precio_compra}</p>
          </div>
        ))}
      </div>
      
      <h2 className="text-xl font-bold text-gray-800 my-4">
        Historial de la devolución
      </h2>
      <div className="bg-white p-4 rounded-lg shadow">
         {devolucion.historial.map((hist, index: number) => (
            <div key={index} className="grid grid-cols-3 text-sm border-b p-2">
              <div>{new Date(hist.fecha_creacion).toLocaleString()}</div>
              <div className="font-medium">{hist.estado_nuevo}</div>
              <div>ID Admin: {hist.modificado_por_id}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DevolucionDetallePage;
