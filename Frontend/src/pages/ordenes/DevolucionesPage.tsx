import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import Pagination from "../../components/Pagination";
import { Search, Loader2 } from "lucide-react";
import { useDevoluciones } from "../../modules/devoluciones/hooks/useDevoluciones";
import { EstadoDevolucion } from "../../modules/devoluciones/types/enums";
import type { EstadoDevolucion as EstadoDevolucionType } from "../../modules/devoluciones/types/enums";

//  COMPONENTE AUXILIAR
const DetailActionCell = ({ idDevolucion }: { idDevolucion: string }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/ordenes/devoluciones/${idDevolucion}`);
  };
  return (
    <TableCell className="w-10 min-w-[40px] text-center">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center p-1 text-gray-500 hover:text-blue-500 transition duration-150"
        title={`Ver detalles de la devolución #${idDevolucion}`}
      >
        <Search className="h-5 w-5" />
      </button>
    </TableCell>
  );
};

// DevolucionesPage
export default function DevolucionesPage() {
  const [busquedaOrden, setBusquedaOrden] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoDevolucionType | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Hook real de devoluciones
  const { devoluciones, isLoading } = useDevoluciones();

  // Filtrado local
  const devolucionesFiltradas = devoluciones.filter(d => {
    const matchOrden = busquedaOrden
      ? d.orderId.toLowerCase().includes(busquedaOrden.toLowerCase()) ||
        d.id.toLowerCase().includes(busquedaOrden.toLowerCase())
      : true;

    const matchEstado = estadoFiltro ? d.estado === estadoFiltro : true;

    return matchOrden && matchEstado;
  });

  const totalItems = devolucionesFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Paginación local
  const startIndex = (page - 1) * pageSize;
  const devolucionesPaginadas = devolucionesFiltradas.slice(
    startIndex,
    startIndex + pageSize
  );

  // Estados disponibles desde el enum
  const estados = Object.values(EstadoDevolucion);

  const numColumns = 6;

  const getStatusVariant = (status: EstadoDevolucionType) => {
    switch (status) {
      case EstadoDevolucion.COMPLETADA:
        return "success";
      case EstadoDevolucion.CANCELADA:
        return "danger";
      case EstadoDevolucion.PENDIENTE:
        return "warning";
      case EstadoDevolucion.PROCESANDO:
        return "neutral";
      default:
        return "neutral";
    }
  };

  const handleClear = () => {
    setBusquedaOrden("");
    setEstadoFiltro("");
    setPage(1);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Devoluciones</h1>

      {/* ----------------- FILTROS ----------------- */}
      <div className="flex flex-col gap-4 mb-6 w-full">
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
          <div className="w-full sm:w-64 min-w-0">
            <Input
              label="Buscar por ID Orden o ID Devolución"
              placeholder="ID de Orden o Devolución"
              value={busquedaOrden}
              onChange={e => {
                setBusquedaOrden(e.target.value);
                setPage(1);
              }}
              rightIcon={Search}
            />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <label htmlFor="estadoFiltro" className="mb-[8px] block text-base font-medium text-dark">
              Estado de devolución
            </label>
            <select
              id="estadoFiltro"
              className="bg-white w-full rounded-md border py-[10px] px-4 text-dark"
              value={estadoFiltro}
              onChange={e => {
                setEstadoFiltro(e.target.value as EstadoDevolucionType | "");
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {estados.map(e => (
                <option key={e} value={e}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="text-body-color px-3 py-2 rounded-md border-none bg-transparent hover:text-secondary-color"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/*  TABLA  */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-[800px] w-full border-collapse mb-2 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader
                label="#"
                className="w-10 min-w-[40px] text-center"
              />
              <TableHeader label="ID de Devolución" className="min-w-[150px]" />
              <TableHeader label="ID de Orden" className="min-w-[150px]" />
              <TableHeader label="Fecha Creación" className="min-w-[120px]" />
              <TableHeader label="Estado" className="min-w-[100px]" />
              <th className="w-10 min-w-[40px] text-center border border-stroke" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={numColumns}
                  className="text-center py-8 text-blue-500"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Cargando devoluciones...
                </td>
              </tr>
            ) : devolucionesPaginadas.length === 0 ? (
              <tr>
                <td
                  colSpan={numColumns}
                  className="text-center py-4 border border-stroke text-gray-500"
                >
                  {devoluciones.length === 0 
                    ? "No hay devoluciones registradas. Crea una nueva devolución para comenzar."
                    : "No hay devoluciones que coincidan con los filtros aplicados."}
                </td>
              </tr>
            ) : (
              devolucionesPaginadas.map((d, idx) => (
                <tr
                  key={d.id}
                  className={idx % 2 ? "bg-gray-50" : "bg-white"}
                >
                  <TableCell className="w-10 min-w-[40px] text-center">
                    {idx + startIndex + 1}
                  </TableCell>

                  <TableCell>{d.id}</TableCell>
                  <TableCell>{d.orderId}</TableCell>
                  <TableCell>
                    {new Date(d.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={d.estado.charAt(0).toUpperCase() + d.estado.slice(1)}
                      variant={getStatusVariant(d.estado)}
                    />
                  </TableCell>

                  <DetailActionCell idDevolucion={d.id} />
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-end items-center w-full mt-2">
          <span className="text-sm text-gray-500 mr-2">
            {`Mostrando ${totalItems === 0 ? 0 : startIndex + 1} - ${totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems)} de ${totalItems} resultados`}
          </span>
        </div>
        <div className="flex justify-center mt-4 w-full">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
