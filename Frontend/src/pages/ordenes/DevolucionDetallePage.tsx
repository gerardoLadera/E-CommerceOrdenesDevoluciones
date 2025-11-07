import React, { useState /*, useEffect */ } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import { TableHeader, TableCell, StatusBadge } from "../../components/Table";
import CustomStatusDropdown from "../../components/StatusDropdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aprobarDevolucion } from "../../modules/ordenes/api/devoluciones";

// TIPOS DE DATOS
type Option = { value: string; label: string };
type EstadoDevolucion = "SOLICITADO" | "APROBADO" | "RECHAZADO";
type StatusVariant = "neutral" | "success" | "danger" | "warning";

interface ArticuloDevuelto {
  id: number;
  accionSolicitada: string;
  idArticuloDevuelto: string;
  nombreArticuloDevuelto: string;
  precioPagadoUnidad: number;
  cantidadDevuelta: number;
  motivo: string;
  idArticuloNuevo: string;
  nombreArticuloNuevo: string;
  precioUnidadNuevo: number;
  ajusteSaldo: number;
  razonAjuste: string;
}

interface DetalleDevolucion {
  id: string;
  tipoDevolucion: "Mixta" | "Reembolso" | "Reemplazo";
  idOrdenOriginal: string;
  estado: EstadoDevolucion;
  datosCliente: {
    nombres: string;
    apellido: string;
    telefono: string;
    email: string;
    tipoDocumento: string;
    nDocumento: string;
  };
  resolucionFinanciera: {
    balanceNeto: number;
    idOrdenNueva: string;
    estadoDePago: string;
    montoReembolsado: number;
    idDeTransaccion: string;
    estadoDelReembolso: string;
  };
  historialDevolucion: {
    fechaHora: string;
    estado: string;
    modificadoPor: string;
  }[];
  articulos: ArticuloDevuelto[];
}

// DATOS MOCK - LISTA con los IDs de DevolucionesPage
const MOCK_DATA_LIST: DetalleDevolucion[] = [
  // Mock 1: ID = d2f1-c2d2-d3f4 (Estado: SOLICITADO)
  {
    id: "d2f1-c2d2-d3f4",
    tipoDevolucion: "Mixta",
    idOrdenOriginal: "d2f1-c2d2-e3f4",
    estado: "SOLICITADO",
    datosCliente: {
      nombres: "Jorge Andrés",
      apellido: "Rivas Soto",
      telefono: "987 654 321",
      email: "jorge.rivas@correo.com",
      tipoDocumento: "DNI",
      nDocumento: "76543210",
    },
    resolucionFinanciera: {
      balanceNeto: 15.0,
      idOrdenNueva: "99d4-83f1-c7a2-b6e9",
      estadoDePago: "PAGADO",
      montoReembolsado: 25.0,
      idDeTransaccion: "T2025-09-27-001A",
      estadoDelReembolso: "EXITOSO",
    },
    historialDevolucion: [
      {
        fechaHora: "2025-09-26 10:00",
        estado: "SOLICITADO",
        modificadoPor: "Apellido",
      },
      {
        fechaHora: "2025-09-27 09:00",
        estado: "APROBADO",
        modificadoPor: "Telefono",
      },
    ],
    articulos: [
      {
        id: 1,
        accionSolicitada: "REEMBOLSO",
        idArticuloDevuelto: "1001",
        nombreArticuloDevuelto: "Balón de Fútbol Sala",
        precioPagadoUnidad: 25.0,
        cantidadDevuelta: 1,
        motivo: "Mal funcionar",
        idArticuloNuevo: "(N/A)",
        nombreArticuloNuevo: "(N/A)",
        precioUnidadNuevo: 0.0,
        ajusteSaldo: 25.0,
        razonAjuste: "A FAVOR DEL CLIENTE",
      },
      {
        id: 2,
        accionSolicitada: "REEMPLAZO",
        idArticuloDevuelto: "1002",
        nombreArticuloDevuelto: "Zapatillas Running",
        precioPagadoUnidad: 85.0,
        cantidadDevuelta: 1,
        motivo: "Talla incorrecta",
        idArticuloNuevo: "2005",
        nombreArticuloNuevo: "Zapatillas Runni",
        precioUnidadNuevo: 85.0,
        ajusteSaldo: 0.0,
        razonAjuste: "SALDO CERO",
      },
    ],
  },
  // Mock 2: ID = a9e1-b1c2-d3f4 (Estado: RECHAZADO) - Añadido para prueba
  {
    id: "a9e1-b1c2-d3f4",
    tipoDevolucion: "Reemplazo",
    idOrdenOriginal: "z3w4-e3f4-e3f4",
    estado: "RECHAZADO",
    datosCliente: {
      nombres: "Amanda",
      apellido: "Quilla Robles",
      telefono: "123 456 789",
      email: "amanda@correo.com",
      tipoDocumento: "RUC",
      nDocumento: "20123456789",
    },
    resolucionFinanciera: {
      balanceNeto: 0.0,
      idOrdenNueva: "(N/A)",
      estadoDePago: "(N/A)",
      montoReembolsado: 0.0,
      idDeTransaccion: "(N/A)",
      estadoDelReembolso: "RECHAZADO",
    },
    historialDevolucion: [
      {
        fechaHora: "2025-09-01 15:00",
        estado: "SOLICITADO",
        modificadoPor: "System",
      },
      {
        fechaHora: "2025-09-05 11:00",
        estado: "RECHAZADO",
        modificadoPor: "Admin",
      },
    ],
    articulos: [
      {
        id: 1,
        accionSolicitada: "REEMPLAZO",
        idArticuloDevuelto: "2001",
        nombreArticuloDevuelto: "Camiseta Pro S",
        precioPagadoUnidad: 40.0,
        cantidadDevuelta: 1,
        motivo: "No hay stock",
        idArticuloNuevo: "2001",
        nombreArticuloNuevo: "Camiseta Pro L",
        precioUnidadNuevo: 55.0,
        ajusteSaldo: 0.0,
        razonAjuste: "RECHAZADO",
      },
    ],
  },
];

const ESTADOS_DISPONIBLES: EstadoDevolucion[] = [
  "SOLICITADO",
  "APROBADO",
  "RECHAZADO",
];

const ESTADO_OPTIONS: Option[] = ESTADOS_DISPONIBLES.map(estado => ({
  value: estado,
  label: estado,
}));

const getEstadoStyle = (estado: string): string => {
  switch (estado as EstadoDevolucion) {
    case "SOLICITADO":
      return "bg-yellow-500";
    case "APROBADO":
      return "bg-green-500";
    case "RECHAZADO":
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

  const { mutate: aprobarDevolucionMutation, isPending } = useMutation({
    mutationFn: aprobarDevolucion,
    onSuccess: () => {
      alert("Devolución aprobada y reembolso procesado exitosamente.");
      // Invalidamos la query de esta devolución para que se refresque con los nuevos datos
      queryClient.invalidateQueries({ queryKey: ["devolucion", id] }); 
    },
    onError: (error) => {
      console.error("Error al aprobar la devolución:", error);
      alert(`Error al procesar la devolución: ${error.message}`);
    },
  });

  const devolucion = MOCK_DATA_LIST.find(d => d.id === id);

  if (!devolucion) {
    return (
      <div className="p-10 text-center text-xl text-red-600 font-bold">
        Error: Devolución con ID "{id}" no encontrada en los datos simulados.
      </div>
    );
  }

  const [currentEstado, setCurrentEstado] = useState<EstadoDevolucion>(
    devolucion.estado
  );

  const handleEstadoChange = (newValue: string) => {
    // Actualizamos el estado visual inmediatamente
    setCurrentEstado(newValue as EstadoDevolucion);

    // Si el nuevo estado es "APROBADO" y el ID existe, disparamos la mutación
    if (newValue === "APROBADO" && id) {
        console.log(`Disparando aprobación para la devolución: ${id}`);
        aprobarDevolucionMutation(id);
    } else {
        console.log(
        `[MOCK]: Cambio de estado a ${newValue} (sin acción de API)`
        );
    }
  };

  const handleVerOrdenGenerada = () => {
    const idOrden = devolucion.resolucionFinanciera.idOrdenNueva;
    navigate(`/ordenes/${idOrden}`);
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* TÍTULO Y ESTADO */}
      <div className="flex justify-between items-center mb-6">
        {" "}
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          Detalles de la devolución:{" "}
          <span className="ml-3 px-3 py-1 text-lg font-mono text-black bg-gray-300 rounded-lg">
            {devolucion.id}{" "}
          </span>{" "}
        </h1>{" "}
        <CustomStatusDropdown
          currentValue={currentEstado}
          options={ESTADO_OPTIONS}
          onChange={handleEstadoChange}
          getColorStyle={getEstadoStyle}
        />
      </div>
      {/* INFO BÁSICA (Tipo y Orden Original) */}
      <div className="flex space-x-4 mb-8 text-sm">
        {" "}
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          {" "}
          <span className="font-semibold text-gray-600">
            Tipo de devolución:
          </span>{" "}
          <span className="font-semibold text-black">
            {devolucion.tipoDevolucion}
          </span>{" "}
        </div>{" "}
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
          {" "}
          <span className="font-semibold text-gray-600">
            ID de Orden Original:
          </span>{" "}
          <span className="font-semibold text-black">
            {devolucion.idOrdenOriginal}
          </span>{" "}
        </div>{" "}
      </div>
      {/* CONTENEDORES DE DATOS LATERALES (3 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 1. Datos del cliente */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          {" "}
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2">
            Datos del cliente:
          </h2>{" "}
          <DataRow
            label="Nombres"
            value={devolucion.datosCliente.nombres}
            isFirst
          />{" "}
          <DataRow label="Apellido" value={devolucion.datosCliente.apellido} />{" "}
          <DataRow label="Telefono" value={devolucion.datosCliente.telefono} />
          <DataRow label="Email" value={devolucion.datosCliente.email} />{" "}
          <DataRow
            label="Tipo Documento"
            value={devolucion.datosCliente.tipoDocumento}
          />{" "}
          <DataRow
            label="N° Documento"
            value={devolucion.datosCliente.nDocumento}
            isLast
          />{" "}
        </div>
        {/* 2. Resolución financiera */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          {" "}
          <h2 className="text-lg font-bold text-gray-800 mb-2 p-2">
            Resolución financiera:
          </h2>{" "}
          <DataRow
            label="Balance neto"
            value={`+${devolucion.resolucionFinanciera.balanceNeto.toFixed(2)}`}
            isFirst
          />{" "}
          <DataRow
            label="ID de la orden nueva"
            value={devolucion.resolucionFinanciera.idOrdenNueva}
          />{" "}
          <DataRow
            label="Estado de pago"
            value={devolucion.resolucionFinanciera.estadoDePago}
          />{" "}
          <DataRow
            label="Monto reembolsado"
            value={devolucion.resolucionFinanciera.montoReembolsado.toFixed(2)}
          />{" "}
          <DataRow
            label="ID de la transacción"
            value={devolucion.resolucionFinanciera.idDeTransaccion}
          />{" "}
          <DataRow
            label="Estado del reembolso"
            value={devolucion.resolucionFinanciera.estadoDelReembolso}
            isLast
          />{" "}
        </div>
        {/* 3. Historial de la devolución */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          {" "}
          <h2 className="text-lg font-bold text-black p-3">
            Historial de la devolución:
          </h2>{" "}
          <div
            className="grid grid-cols-3 rounded-t-lg text-xs font-bold text-black uppercase"
            style={{ backgroundColor: "#C9B35E" }}
          >
            {" "}
            <div className="p-2 border-r border-white">Fecha y Hora</div>{" "}
            <div className="p-2 border-r border-white">Estado</div>{" "}
            <div className="p-2">Modificado Por</div>{" "}
          </div>{" "}
          {/* ITEMS DEL HISTORIAL */}
          {devolucion.historialDevolucion.map((hist, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 text-sm border-b border-gray-100 ${index === devolucion.historialDevolucion.length - 1 ? "rounded-b-lg" : ""}`}
            >
              {" "}
              <div className="p-2 text-gray-600">{hist.fechaHora}</div>{" "}
              <div className="p-2 text-gray-800 font-medium">{hist.estado}</div>{" "}
              <div className="p-2 text-gray-600">{hist.modificadoPor}</div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>
      {/* TABLA DE ARTÍCULOS */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Artículos de la Devolución/Reemplazo
      </h2>
      <ArticulosTable articulos={devolucion.articulos} />{" "}
      {/* BOTÓN "VER ORDEN GENERADA" */}
      <div className="flex justify-end p-4 border-t border-gray-200">
        {" "}
        <Button
          text="VER ORDEN GENERADA"
          onClick={handleVerOrdenGenerada}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:bg-green-700 transition"
          style={{ backgroundColor: "#332F23" }}
        />
      </div>{" "}
    </div>
  );
};

export default DevolucionDetallePage;
