import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Input from "../../components/Input";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import Pagination from "../../components/Pagination";
import { Search, Loader2 } from "lucide-react";

interface Orden {
  idOrden: string;
  nombreCliente: string;
  fecha: string;
  estado: "APROBADO" | "PENDIENTE" | "CERRADO" | "ANULADO";
  tipoDevolucion: "INACTIVO" | "REEMBOLSO" | "REEMPLAZO";
  montoTotal: number;
}

// Datos mock
const ordenesDataMock: Orden[] = [
    { idOrden: "a9e1-b1c2-d3f4", nombreCliente: "Luis Gutiérrez Pérez", fecha: "2025-09-01", estado: "CERRADO", tipoDevolucion: "REEMBOLSO", montoTotal: 500 },
    { idOrden: "a9e1-b1c2-d3f5", nombreCliente: "Amanda Quilla Robles", fecha: "2025-09-05", estado: "APROBADO", tipoDevolucion: "INACTIVO", montoTotal: 400 },
    { idOrden: "a9e1-b1c2-d3f6", nombreCliente: "Pablo Cuesta Huerta", fecha: "2025-09-07", estado: "CERRADO", tipoDevolucion: "INACTIVO", montoTotal: 345 },
    { idOrden: "a9e1-b1c2-d3f7", nombreCliente: "Raul Santino Palacios", fecha: "2025-09-07", estado: "APROBADO", tipoDevolucion: "INACTIVO", montoTotal: 455 },
    { idOrden: "a9e1-b1c2-d3f8", nombreCliente: "María Quispe Falcon", fecha: "2025-09-08", estado: "PENDIENTE", tipoDevolucion: "INACTIVO", montoTotal: 415 },
    { idOrden: "a9e1-b1c2-d3f9", nombreCliente: "Lucía Ramírez Cruz", fecha: "2025-09-08", estado: "APROBADO", tipoDevolucion: "REEMPLAZO", montoTotal: 345 },
    { idOrden: "a9e1-b1c2-d3fa", nombreCliente: "Andrea Vargas Soto", fecha: "2025-09-08", estado: "ANULADO", tipoDevolucion: "INACTIVO", montoTotal: 455 },
    { idOrden: "a9e1-b1c2-d3fb", nombreCliente: "Paula Herrera Ortega", fecha: "2025-09-08", estado: "APROBADO", tipoDevolucion: "INACTIVO", montoTotal: 345 },
    { idOrden: "a9e1-b1c2-d3fc", nombreCliente: "Ricardo Serrano Núñez", fecha: "2025-09-08", estado: "PENDIENTE", tipoDevolucion: "INACTIVO", montoTotal: 455 },
];

const getOrdenes = async (params: {
  page: number;
  pageSize: number;
  busquedaId: string;
  busquedaCliente: string;
  estado: string;
  tipoDevolucion: string; 
  fechaInicio: string;
  fechaFin: string;
}): Promise<{
  data: Orden[];
  totalItems: number;
  estados: string[];
  tiposDevolucion: string[]; 
}> => {
  await new Promise(resolve => setTimeout(resolve, 500)); 

  const filtered = ordenesDataMock.filter(o => {
    const idMatch = params.busquedaId ? o.idOrden.toLowerCase().startsWith(params.busquedaId.toLowerCase()) : true;
    const nombreClienteMatch = params.busquedaCliente ? o.nombreCliente.toLowerCase().includes(params.busquedaCliente.toLowerCase()) : true;
    const estadoMatch = params.estado ? o.estado === params.estado : true;
    const tipoMatch = params.tipoDevolucion ? o.tipoDevolucion === params.tipoDevolucion : true; 
    const fechaInicioMatch = params.fechaInicio ? o.fecha >= params.fechaInicio : true;
    const fechaFinMatch = params.fechaFin ? o.fecha <= params.fechaFin : true;
    return idMatch && nombreClienteMatch && estadoMatch && tipoMatch && fechaInicioMatch && fechaFinMatch;
  });

  const paginatedData = filtered.slice((params.page - 1) * params.pageSize, params.page * params.pageSize);

  return {
    data: paginatedData,
    totalItems: filtered.length,
    estados: Array.from(new Set(ordenesDataMock.map(o => o.estado))),
    tiposDevolucion: Array.from(new Set(ordenesDataMock.map(o => o.tipoDevolucion))), 
  };
};

// boton para ver detalles.
const DetailActionCell = ({ idOrden }: { idOrden: string }) => {
  const navigate = useNavigate();
  const handleClick = () => { navigate(`/ordenes/ordenes/${idOrden}`); };
  return (
    <TableCell className="w-10 min-w-[40px] text-center">
      <button type="button" onClick={handleClick} className="inline-flex items-center justify-center p-1 text-gray-500 hover:text-blue-500 transition duration-150" title={`Ver detalles de la orden #${idOrden}`}>
        <Search className="h-5 w-5" />
      </button>
    </TableCell>
  );
};

// main
export default function OrdenesPage() {
  // estados
  const [busquedaId, setBusquedaId] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoDevolucion, setTipoDevolucion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;


  const { data, isLoading } = useQuery({
    queryKey: ["ordenes", page, pageSize, busquedaId, busquedaCliente, estado, tipoDevolucion, fechaInicio, fechaFin], 
    queryFn: () => getOrdenes({ page, pageSize, busquedaId, busquedaCliente, estado, tipoDevolucion, fechaInicio, fechaFin }), 
    staleTime: 5 * 60 * 1000,
  });

  // extraccion de datos
  const ordenes = data?.data || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const estados = data?.estados || [];
  const tiposDevolucion = data?.tiposDevolucion || []; 
  const startIndex = (page - 1) * pageSize;
  const numColumns = 8;

  const getStatusVariant = (status: Orden["estado"]) => {
    switch (status) { case "APROBADO": return "success"; case "PENDIENTE": return "warning"; case "CERRADO": return "neutral"; case "ANULADO": return "danger"; default: return "neutral";}
  };
  
  const getDevolucionVariant = (tipo: Orden["tipoDevolucion"]) => {
    switch (tipo) { case "REEMBOLSO": return "bg-red-100 text-red-800"; case "REEMPLAZO": return "bg-blue-100 text-blue-800"; case "INACTIVO": return "bg-gray-100 text-gray-800"; default: return "bg-gray-100 text-gray-800"; }
  };

  // Limpia todos los filtros
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
      <h1 className="text-2xl font-bold mb-4">Órdenes</h1>

      {/* Filtros */}
      <div className="flex flex-col gap-4 mb-6 w-full">
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
            <div className="w-full sm:w-64 min-w-0"><Input label="Buscar por ID" placeholder="ID de Orden" value={busquedaId} onChange={e => { setBusquedaId(e.target.value); setPage(1); }} rightIcon={Search}/></div>
            <div className="w-full sm:w-48 min-w-0"><Input label="Fecha inicio" type="date" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setPage(1); }}/></div>
            <div className="w-full sm:w-48 min-w-0">
                <label className="mb-[8px] block text-base font-medium text-dark">Estado</label>
                <select className="bg-white w-full rounded-md border py-[10px] px-4 text-dark" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
                    <option value="">Todos</option>
                    {estados.map(e => (<option key={e} value={e}>{e}</option>))}
                </select>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
            <div className="w-full sm:w-64 min-w-0"><Input label="Buscar por cliente" placeholder="Nombre del cliente" value={busquedaCliente} onChange={e => { setBusquedaCliente(e.target.value); setPage(1); }} rightIcon={Search}/></div>
            <div className="w-full sm:w-48 min-w-0"><Input label="Fecha fin" type="date" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setPage(1); }}/></div>
            <div className="w-full sm:w-48 min-w-0">
                <label className="mb-[8px] block text-base font-medium text-dark">Tipo de devolución</label>
                <select className="bg-white w-full rounded-md border py-[10px] px-4 text-dark" value={tipoDevolucion} onChange={e => { setTipoDevolucion(e.target.value); setPage(1); }}>
                    <option value="">Todos</option>
                    {tiposDevolucion.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
            </div>
            <button type="button" onClick={handleClear} className="text-body-color px-3 py-2 rounded-md border-none bg-transparent hover:text-secondary-color">Clear all</button>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-[900px] w-full border-collapse mb-2 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader label="#" className="w-10 min-w-[40px] text-center" />
              <TableHeader label="ID Orden" className="min-w-[150px]" />
              <TableHeader label="Nombre Cliente" className="min-w-[200px]" />
              <TableHeader label="Fecha" className="min-w-[100px]" />
              <TableHeader label="Estado" className="min-w-[100px]" />
              <TableHeader label="Tipo de Devolución" className="min-w-[120px]" />
              <TableHeader label="Monto total" className="min-w-[100px]" />
              <th className="w-10 min-w-[40px] text-center border border-stroke"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={numColumns} className="text-center py-8 text-blue-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando órdenes...</td></tr>
            ) : ordenes.length === 0 ? (
              <tr><td colSpan={numColumns} className="text-center py-4 border border-stroke text-gray-500">No hay órdenes que coincidan con los filtros.</td></tr>
            // Crea una fila por cada orden.
            ) : (
              ordenes.map((o, idx) => (
                <tr key={o.idOrden} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                  <TableCell className="w-10 min-w-[40px] text-center">{idx + startIndex + 1}</TableCell>
                  <TableCell>{o.idOrden}</TableCell>
                  <TableCell>{o.nombreCliente}</TableCell>
                  <TableCell>{o.fecha}</TableCell>
                  <TableCell><StatusBadge label={o.estado} variant={getStatusVariant(o.estado)} /></TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs font-medium rounded-full ${getDevolucionVariant(o.tipoDevolucion)}`}>{o.tipoDevolucion}</span></TableCell>
                  <TableCell>${o.montoTotal.toFixed(2)}</TableCell>
                  <DetailActionCell idOrden={o.idOrden} />
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Paginación */}
        <div className="flex justify-end items-center w-full mt-2"><span className="text-sm text-gray-500 mr-2">{`Mostrando ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min((startIndex + pageSize), totalItems)} de ${totalItems} resultados`}</span></div>
        <div className="flex justify-center mt-4 w-full"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>
      
      {/* Sección de estadísticas */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-4">Datos globales: SEMANAL</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">356</p><p className="text-sm">Órdenes creadas</p></div>
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">210</p><p className="text-sm">Órdenes pendientes</p></div>
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">140</p><p className="text-sm">Órdenes cerradas</p></div>
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">4</p><p className="text-sm">Órdenes devueltas</p></div>
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">2</p><p className="text-sm">Solicitudes en Espera</p></div>
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center"><p className="text-3xl font-bold">18</p><p className="text-sm">Órdenes anuladas</p></div>
        </div>
      </div>
    </div>
  );
}