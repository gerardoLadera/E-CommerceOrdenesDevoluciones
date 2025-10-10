import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Input from "../../components/Input";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import Pagination from "../../components/Pagination";
import { Search, Loader2 } from "lucide-react";

// TIPOS DE DATOS
interface Devolucion {
  idDevolucion: string;
  idOrden: string;
  nombreCliente: string;
  fecha: string;
  tipoDevolucion: string;
  estado: "APROBADO" | "RECHAZADO" | "SOLICITADO";
  montoTotal: number;
}

//  DATOS MOCKUP
const devolucionesDataMock: Devolucion[] = [
  {
    idDevolucion: "d2f1-c2d2-d3f4",
    idOrden: "c2d2-e3f4-d3f4",
    nombreCliente: "Luis Gutiérrez Pérez",
    fecha: "2025-09-01",
    tipoDevolucion: "Reembolso",
    estado: "RECHAZADO",
    montoTotal: 500,
  },
  {
    idDevolucion: "a9e1-b1c2-d3f4",
    idOrden: "z3w4-e3f4-e3f4",
    nombreCliente: "Amanda Quilla Robles",
    fecha: "2025-09-05",
    tipoDevolucion: "Reemplazo",
    estado: "RECHAZADO",
    montoTotal: 400,
  },
  {
    idDevolucion: "c2d2-e3f4-d3f4",
    idOrden: "p2q4-r6s8-d3f4",
    nombreCliente: "Pablo Cuesta Huerta",
    fecha: "2025-09-08",
    tipoDevolucion: "Reemplazo",
    estado: "RECHAZADO",
    montoTotal: 345,
  },
  {
    idDevolucion: "a1a1-b2b2-c3c3",
    idOrden: "z3w4-e3f4-e3f4",
    nombreCliente: "Raul Santino Palacios",
    fecha: "2025-09-07",
    tipoDevolucion: "Mixta",
    estado: "APROBADO",
    montoTotal: 455,
  },
  {
    idDevolucion: "x1y2-z3w4-v5u6",
    idOrden: "x1y2-z3w4-e3f4",
    nombreCliente: "María Quispe Falcon",
    fecha: "2025-09-08",
    tipoDevolucion: "Reemplazo",
    estado: "APROBADO",
    montoTotal: 415,
  },
];

// FUNCIÓN DE FETCH SIMULADA
const getDevoluciones = async (params: {
  page: number;
  pageSize: number;
  busquedaOrden: string;
  busquedaCliente: string;
  estado: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
}): Promise<{
  data: Devolucion[];
  totalItems: number;
  estados: string[];
  tiposDevolucion: string[];
}> => {
  const {
    busquedaOrden,
    busquedaCliente,
    estado,
    tipo,
    fechaInicio,
    fechaFin,
  } = params;

  //filtrado y paginación
  const filtered = devolucionesDataMock.filter(d => {
    const termOrden = busquedaOrden.toLowerCase();
    const termCliente = busquedaCliente.toLowerCase();

    const idOrdenMatch = busquedaOrden
      ? d.idOrden.toLowerCase().startsWith(termOrden)
      : true;

    const nombreClienteMatch = busquedaCliente
      ? d.nombreCliente.toLowerCase().includes(termCliente)
      : true;

    const estadoMatch = estado ? d.estado === estado : true;
    const tipoMatch = tipo ? d.tipoDevolucion === tipo : true;
    const fechaInicioMatch = fechaInicio ? d.fecha >= fechaInicio : true;
    const fechaFinMatch = fechaFin ? d.fecha <= fechaFin : true;

    return (
      idOrdenMatch &&
      nombreClienteMatch &&
      estadoMatch &&
      tipoMatch &&
      fechaInicioMatch &&
      fechaFinMatch
    );
  });

  const paginatedData = filtered.slice(
    (params.page - 1) * params.pageSize,
    params.page * params.pageSize
  );

  return {
    data: paginatedData,
    totalItems: filtered.length,
    estados: Array.from(new Set(devolucionesDataMock.map(d => d.estado))),
    tiposDevolucion: Array.from(
      new Set(devolucionesDataMock.map(d => d.tipoDevolucion))
    ),
  };
};

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
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // useQuery
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "devoluciones",
      page,
      pageSize,
      busquedaOrden,
      busquedaCliente,
      estado,
      tipo,
      fechaInicio,
      fechaFin,
    ],
    queryFn: () =>
      getDevoluciones({
        page,
        pageSize,
        busquedaOrden,
        busquedaCliente,
        estado,
        tipo,
        fechaInicio,
        fechaFin,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const devoluciones = data?.data || [];
  const totalItems = data?.totalItems || 0;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const estados = data?.estados || [];
  const tiposDevolucion = data?.tiposDevolucion || [];

  const startIndex = (page - 1) * pageSize;
  const numColumns = 9;

  const getStatusVariant = (status: Devolucion["estado"]) => {
    switch (status) {
      case "APROBADO":
        return "success";
      case "RECHAZADO":
        return "danger";
      case "SOLICITADO":
        return "warning";
      default:
        return "neutral";
    }
  };

  const handleClear = () => {
    setBusquedaOrden("");
    setBusquedaCliente("");
    setEstado("");
    setTipo("");
    setFechaInicio("");
    setFechaFin("");
    setPage(1);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Devoluciones</h1>

      {/* ----------------- FILTROS ----------------- */}
      <div className="flex flex-col gap-4 mb-6 w-full">
        {/* Primera Fila de Filtros */}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
          <div className="w-full sm:w-64 min-w-0">
            <Input
              label="Buscar por ID Orden"
              placeholder="ID de Orden"
              value={busquedaOrden}
              onChange={e => {
                setBusquedaOrden(e.target.value);
                setPage(1);
              }}
              rightIcon={Search}
            />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <Input
              label="Fecha inicio"
              type="date"
              placeholder="Fecha de inicio"
              value={fechaInicio}
              onChange={e => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <label className="mb-[8px] block text-base font-medium text-dark">
              Estado de devolución
            </label>
            <select
              className="bg-white w-full rounded-md border py-[10px] px-4 text-dark"
              value={estado}
              onChange={e => {
                setEstado(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {estados.map(e => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda Fila de Filtros */}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end w-full">
          <div className="w-full sm:w-64 min-w-0">
            <Input
              label="Buscar por cliente"
              placeholder="Nombre del cliente"
              value={busquedaCliente}
              onChange={e => {
                setBusquedaCliente(e.target.value);
                setPage(1);
              }}
              rightIcon={Search}
            />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <Input
              label="Fecha fin"
              type="date"
              placeholder="Fecha de fin"
              value={fechaFin}
              onChange={e => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-48 min-w-0">
            <label className="mb-[8px] block text-base font-medium text-dark">
              Tipo de devolución
            </label>
            <select
              className="bg-white w-full rounded-md border py-[10px] px-4 text-dark"
              value={tipo}
              onChange={e => {
                setTipo(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {tiposDevolucion.map(t => (
                <option key={t} value={t}>
                  {t}
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
            Clear all
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
              <TableHeader label="ID de Devolución" className="min-w-[120px]" />
              <TableHeader label="ID de Orden" className="min-w-[120px]" />
              <TableHeader label="Nombre Cliente" className="min-w-[150px]" />
              <TableHeader label="Fecha" className="min-w-[80px]" />
              <TableHeader label="Tipo Devolución" className="min-w-[100px]" />
              <TableHeader label="Estado" className="min-w-[80px]" />
              <TableHeader label="Monto total" className="min-w-[80px]" />
              <th className="w-10 min-w-[40px] text-center border border-stroke"></th>
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
            ) : devoluciones.length === 0 ? (
              <tr>
                <td
                  colSpan={numColumns}
                  className="text-center py-4 border border-stroke text-gray-500"
                >
                  No hay devoluciones que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              devoluciones.map((d, idx) => (
                <tr
                  key={d.idDevolucion}
                  className={idx % 2 ? "bg-gray-50" : "bg-white"}
                >
                  <TableCell className="w-10 min-w-[40px] text-center">
                    {idx + startIndex + 1}
                  </TableCell>

                  <TableCell>{d.idDevolucion}</TableCell>
                  <TableCell>{d.idOrden}</TableCell>
                  <TableCell>{d.nombreCliente}</TableCell>
                  <TableCell>{d.fecha}</TableCell>
                  <TableCell>{d.tipoDevolucion}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={d.estado}
                      variant={getStatusVariant(d.estado)}
                    />
                  </TableCell>
                  <TableCell>{d.montoTotal}</TableCell>

                  <DetailActionCell idDevolucion={d.idDevolucion} />
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
