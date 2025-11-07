import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from 'axios';

// componentes
import Input from "../../components/Input";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import Pagination from "../../components/Pagination";
import { Search, Loader2 } from "lucide-react";

// interfaz para las ordenes
interface Orden {
  idOrden: string;
  nombreCliente: string;
  fecha: string;
  estado: string;
  tipoDevolucion: string;
  montoTotal: number;
}

// funcion para obtener ordenes desde el backend
const getOrdenes = async (params: {
  page: number;
  pageSize: number;
  busquedaId: string;
  busquedaCliente: string;
  estado: string;
  tipoDevolucion: string;
  fechaInicio: string;
  fechaFin: string;
}) => {
  // construye los parametros de busqueda
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.pageSize),
  });

  // agrega los filtros si existen
  if (params.busquedaId) queryParams.append('busquedaId', params.busquedaId);
  if (params.busquedaCliente) queryParams.append('busquedaCliente', params.busquedaCliente);
  if (params.estado) queryParams.append('estado', params.estado);
  if (params.tipoDevolucion) queryParams.append('tiene_devolucion', params.tipoDevolucion);
  if (params.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
  if (params.fechaFin) queryParams.append('fechaFin', params.fechaFin);

  // selecciona la url segun el entorno
  const BASE_URL = import.meta.env.MODE === "production"
    ? "https://orders-query-833583666995.us-central1.run.app"
    : "http://localhost:3002";

  const apiUrl = `${BASE_URL}/api/orders?${queryParams.toString()}`;

  try {
    const response = await axios.get(apiUrl);
    const apiData = response.data;

    // mapea los datos del backend al formato usado por el frontend
    const MAPPED_DATA: Orden[] = apiData.data.map((ordenApi: any) => ({
      idOrden: ordenApi.cod_orden,
      nombreCliente: ordenApi.nombre,
      fecha: new Date(ordenApi.fechaCreacion).toLocaleDateString(),
      estado: ordenApi.estado,
      tipoDevolucion: ordenApi.tiene_devolucion ? "SI" : "NO",
      montoTotal: ordenApi.total,
    }));

    return {
      data: MAPPED_DATA,
      totalItems: apiData.total,
      estados: ['PAGADO', 'CANCELADO'],
      tiposDevolucion: [{ label: 'SI', value: 'true' }, { label: 'NO', value: 'false' }],
    };

  } catch (error) {
    console.error("error al obtener las ordenes:", error);
    return { data: [], totalItems: 0, estados: [], tiposDevolucion: [] };
  }
};

// boton para ver detalles de una orden
const DetailActionCell = ({ idOrden }: { idOrden: string }) => {
  const navigate = useNavigate();
  const handleClick = () => { navigate(`/ordenes/ordenes/${idOrden}`); };
  return (
    <TableCell className="w-10 min-w-[40px] text-center">
      <button type="button" onClick={handleClick} className="inline-flex items-center justify-center p-1 text-gray-500 hover:text-blue-500 transition duration-150" title={`ver detalles de la orden #${idOrden}`}>
        <Search className="h-5 w-5" />
      </button>
    </TableCell>
  );
};

// componente principal
export default function OrdenesPage() {
  // estados de filtros
  const [busquedaId, setBusquedaId] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoDevolucion, setTipoDevolucion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // obtiene datos usando react query
  const { data, isLoading } = useQuery({
    queryKey: ["ordenes", page, pageSize, busquedaId, busquedaCliente, estado, tipoDevolucion, fechaInicio, fechaFin],
    queryFn: () => getOrdenes({ page, pageSize, busquedaId, busquedaCliente, estado, tipoDevolucion, fechaInicio, fechaFin }),
  });

  // extrae datos
  const ordenes = data?.data || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const estados = data?.estados || [];
  const tiposDevolucion = data?.tiposDevolucion || [];
  const startIndex = (page - 1) * pageSize;
  const numColumns = 8;

  // define color segun estado
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAGADO": return "success";
      case "PENDIENTE": return "warning";
      case "CANCELADO": return "danger";
      case "CERRADO": return "neutral";
      default: return "neutral";
    }
  };

  // limpia los filtros
  const handleClear = () => {
    setBusquedaId("");
    setBusquedaCliente("");
    setEstado("");
    setTipoDevolucion("");
    setFechaInicio("");
    setFechaFin("");
    setPage(1);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Ordenes</h1>

      {/* filtros */}
      <div className="flex flex-col gap-4 mb-6 w-full">
        {/* fila 1 */}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
          <div className="w-full sm:w-64 min-w-0">
            <Input label="Buscar por ID de Orden" placeholder="ID de Orden" value={busquedaId} onChange={e => { setBusquedaId(e.target.value); setPage(1); }} rightIcon={Search} />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <Input label="Fecha inicio" type="date" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setPage(1); }} />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <label className="mb-[8px] block text-base font-medium text-dark">Estado</label>
            <select className="bg-white w-full rounded-md border py-[10px] px-4 text-dark" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              {estados.map(e => (<option key={e} value={e}>{e}</option>))}
            </select>
          </div>
        </div>

        {/* fila 2 */}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
          <div className="w-full sm:w-64 min-w-0">
            <Input label="Buscar por cliente" placeholder="Nombre del cliente" value={busquedaCliente} onChange={e => { setBusquedaCliente(e.target.value); setPage(1); }} rightIcon={Search} />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <Input label="Fecha fin" type="date" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setPage(1); }} />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <label className="mb-[8px] block text-base font-medium text-dark">Tiene devolucion</label>
            <select className="bg-white w-full rounded-md border py-[10px] px-4 text-dark" value={tipoDevolucion} onChange={e => { setTipoDevolucion(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              {tiposDevolucion.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </div>
          <div className="flex-grow"></div>
          <button type="button" onClick={handleClear} className="text-body-color px-3 py-2 rounded-md border-none bg-transparent hover:text-secondary-color self-end mb-[10px]">
            clear all
          </button>
        </div>
      </div>

      {/* tabla y paginacion */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-[900px] w-full border-collapse mb-2 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader label="#" className="w-10 min-w-[40px] text-center" />
              <TableHeader label="ID Orden" className="min-w-[150px]" />
              <TableHeader label="Nombre Cliente" className="min-w-[200px]" />
              <TableHeader label="Fecha" className="min-w-[100px]" />
              <TableHeader label="Estado" className="min-w-[100px]" />
              <TableHeader label="Tiene Devolucion" className="min-w-[120px]" />
              <TableHeader label="Monto total" className="min-w-[100px]" />
              <th className="w-10 min-w-[40px] text-center border border-stroke"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={numColumns} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /> cargando...</td></tr>
            ) : ordenes.length === 0 ? (
              <tr><td colSpan={numColumns} className="text-center py-4 border border-stroke text-gray-500">no se encontraron ordenes</td></tr>
            ) : (
              ordenes.map((o, idx) => (
                <tr key={o.idOrden} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                  <TableCell className="w-10 min-w-[40px] text-center">{idx + startIndex + 1}</TableCell>
                  <TableCell>{o.idOrden}</TableCell>
                  <TableCell>{o.nombreCliente}</TableCell>
                  <TableCell>{o.fecha}</TableCell>
                  <TableCell><StatusBadge label={o.estado} variant={getStatusVariant(o.estado)} /></TableCell>
                  <TableCell>{o.tipoDevolucion}</TableCell>
                  <TableCell>${o.montoTotal.toFixed(2)}</TableCell>
                  <DetailActionCell idOrden={o.idOrden} />
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* paginacion */}
        <div className="flex justify-between items-center w-full mt-4">
          <span className="text-sm text-gray-500">
            {`mostrando ${totalItems > 0 ? startIndex + 1 : 0} - ${Math.min(startIndex + pageSize, totalItems)} de ${totalItems} resultados`}
          </span>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}
