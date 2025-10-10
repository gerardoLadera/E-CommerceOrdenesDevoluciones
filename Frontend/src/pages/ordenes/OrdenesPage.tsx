import React from "react";

import { TableHeader, TableCell } from "../../components/Table";

interface Orden {
  id: number;
  idOrden: string;
  nombreCliente: string;
  fecha: string;
  estado: string;
  montoTotal: number;
}

const ordenesData: Orden[] = [];

export default function OrdenesPage() {
  const numColumns = 7;

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Órdenes</h1>
      <div className="mb-6 h-10"></div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[800px] w-full border-collapse mb-2 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader
                label="#"
                className="w-10 min-w-[40px] text-center"
              />
              <TableHeader label="ID de Orden" className="min-w-[150px]" />
              <TableHeader label="Nombre Cliente" className="min-w-[150px]" />
              <TableHeader label="Fecha" className="min-w-[80px]" />
              <TableHeader label="Estado" className="min-w-[100px]" />
              <TableHeader label="Monto total" className="min-w-[80px]" />
              <th className="w-10 min-w-[40px] text-center border border-stroke"></th>
            </tr>
          </thead>
          <tbody>
            <td
              colSpan={numColumns}
              className="text-center py-4 border border-stroke text-gray-500"
            >
              No hay devoluciones que coincidan con los filtros aplicados.
            </td>
          </tbody>
        </table>
      </div>
    </div>
  );
}
