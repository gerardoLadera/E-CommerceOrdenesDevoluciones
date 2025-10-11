import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import ConfirmationModal from "../../components/ConfimationModal";
import { useState } from "react";
import ReembolsoModal from "../../components/ReembolsoModal";
import ReemplazoModal from "../../components/ReemplazoModal";
interface ItemOrden {
  idItem: string;
  nombreProducto: string;
  precio: number;
}

interface HistorialEstado {
  fecha: string;
  estado: string;
  modificadoPor: string;
}

interface OrdenDetallada {
  idOrden: string;
  cliente: {
    nombres: string;
    apellido: string;
    telefono: string;
    email: string;
    tipoDocumento: string;
    numeroDocumento: string;
  };
  transaccion: {
    tipoEntrega: string;
    pais: string;
    provincia: string;
    ciudad: string;
    direccion: string;
    codigoPostal: string;
  };
  items: ItemOrden[];
  historial: HistorialEstado[];
}

// Datos mock
const ordenDetalladaMock: OrdenDetallada = {
  idOrden: "a9e1-b1c2-d3f4",
  cliente: { nombres: "Jesus Andres", apellido: "Lujan Carrion", telefono: "979396865", email: "abc.cde@unmsm.edu.pe", tipoDocumento: "DNI", numeroDocumento: "74599009" },
  transaccion: { tipoEntrega: "Recojo", pais: "Peru", provincia: "Lima", ciudad: "Lima", direccion: "Urb Campo de Mayo Salamanca Etapa 2", codigoPostal: "11313" },
  items: [
    { idItem: "325466", nombreProducto: "Shampoo Jhonson", precio: 15.00 },
    { idItem: "641316", nombreProducto: "Acondicionador Aerosol", precio: 13.00 },
    { idItem: "6161313", nombreProducto: "Pedigree 1 Kl", precio: 10.00 },
    { idItem: "161616", nombreProducto: "Ricocan", precio: 16.00 },
    { idItem: "116316", nombreProducto: "Sapolio Lavavajillas 1L", precio: 12.00 },
  ],
  historial: [
    { fecha: "20 Setiembre 15:33", estado: "Pendiente", modificadoPor: "Sistema" },
    { fecha: "21 Setiembre 10:05", estado: "Aprobado", modificadoPor: "Admin" },
    { fecha: "22 Setiembre 08:15", estado: "Enviado", modificadoPor: "Admin" },
  ],
};

const getOrdenById = async (id: string | undefined): Promise<OrdenDetallada> => {
  if (!id) throw new Error("ID de orden no proporcionado");
  console.log(`Buscando orden con ID: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula retraso de red.
  return ordenDetalladaMock;
};


// Componente para info
const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex border-b">
        <div className="w-1/3 p-2 font-semibold text-sm text-gray-700" style={{ backgroundColor: '#C9B35E' }}>{label}</div>
        <div className="w-2/3 p-2 text-sm">{value}</div>
    </div>
);


// main
export default function DetalleOrdenPage() {
  const { idOrden } = useParams<{ idOrden: string }>(); 
  const navigate = useNavigate(); // Hook para navegar.
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal.

  const { data: orden, isLoading, isError } = useQuery({
    queryKey: ["orden", idOrden],
    queryFn: () => getOrdenById(idOrden),
  });
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);
  const [isReembolsoModalOpen, setIsReembolsoModalOpen] = useState(false);
  const [isReemplazoModalOpen, setIsReemplazoModalOpen] = useState(false);

  // Lógica para confirmar la anulación. "backend"
  const handleAnularConfirm = async () => {
    console.log(`1. Iniciando anulación para la orden: ${idOrden}`);
    try {
      console.log("2. Enviando petición al backend...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula llamada a API.
      console.log("3. Backend respondió: ¡Éxito!");
      
      setIsModalOpen(false); // Cierra el modal.
      navigate('/ordenes/ordenes'); // Redirige a la lista de órdenes.

    } catch (error) {
      console.error("Error al anular la orden:", error);
      setIsModalOpen(false);
    }
  };
  const handleReembolsoSubmit = (data: any) => { console.log("Procesando reembolso:", data); setIsReembolsoModalOpen(false); };
  const handleReemplazoSubmit = (items: number[]) => { console.log("Procesando reemplazo con items:", items); setIsReemplazoModalOpen(false); };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !orden) {
    return <div className="text-center text-red-500 p-8">Error al cargar los datos de la orden.</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Encabezado con título y acciones. */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Detalles de Orden</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsModalOpen(true)} className="px-3 py-2 text-sm font-semibold bg-red-500 text-white rounded-md hover:bg-red-600">
              Anular Orden
            </button>
          <button onClick={() => setIsReembolsoModalOpen(true)} className="px-3 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90" style={{ backgroundColor: '#C9B35E' }}>Generar reembolso</button>
          <button onClick={() => setIsReemplazoModalOpen(true)} className="px-3 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600">Generar reemplazo</button>
        </div>
      </div>

      {/* Contenido principal en dos columnas. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna izquierda para detalles. */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg mb-2">Datos del cliente</h2>
            <div className="border rounded-md overflow-hidden">
                <InfoField label="Nombres" value={orden.cliente.nombres} />
                <InfoField label="Apellido" value={orden.cliente.apellido} />
                <InfoField label="Teléfono" value={orden.cliente.telefono} />
                <InfoField label="Email" value={orden.cliente.email} />
                <InfoField label="Tipo Documento" value={orden.cliente.tipoDocumento} />
                <InfoField label="Número de Documento" value={orden.cliente.numeroDocumento} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg mb-2">Datos del transaccion</h2>
            <div className="border rounded-md overflow-hidden">
                <InfoField label="Tipo de entrega" value={orden.transaccion.tipoEntrega} />
                <InfoField label="País" value={orden.transaccion.pais} />
                <InfoField label="Provincia" value={orden.transaccion.provincia} />
                <InfoField label="Ciudad" value={orden.transaccion.ciudad} />
                <InfoField label="Dirección de entrega" value={orden.transaccion.direccion} />
                <InfoField label="Código postal" value={orden.transaccion.codigoPostal} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
             <h2 className="font-bold text-lg mb-2">Historial de la orden</h2>
             <table className="w-full text-sm border">
                <thead style={{ backgroundColor: '#C9B35E' }}> 
                    <tr>
                        <th className="p-2 text-left font-semibold">Fecha y Hora</th>
                        <th className="p-2 text-left font-semibold">Estado</th>
                        <th className="p-2 text-left font-semibold">Modificado por</th>
                    </tr>
                </thead>
                <tbody>
                    {orden.historial.map((h, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{h.fecha}</td>
                            <td className="p-2">{h.estado}</td>
                            <td className="p-2">{h.modificadoPor}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Columna derecha para items. */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg mb-2">ITEMS</h2>
            <table className="w-full text-sm border">
                <thead style={{ backgroundColor: '#C9B35E' }}> 
                    <tr>
                        <th className="p-2 text-left font-semibold">ID Item</th>
                        <th className="p-2 text-left font-semibold">Nombre producto</th>
                        <th className="p-2 text-left font-semibold">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    {orden.items.map(item => (
                        <tr key={item.idItem} className="border-b">
                            <td className="p-2">{item.idItem}</td>
                            <td className="p-2">{item.nombreProducto}</td>
                            <td className="p-2">${item.precio.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <ConfirmationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleAnularConfirm}
          title="Anular Orden"
          message="¿Seguro que quiere anular esta orden? Esta acción no se puede deshacer."
        />    
         <ReembolsoModal
        isOpen={isReembolsoModalOpen}
        onClose={() => setIsReembolsoModalOpen(false)}
        onSubmit={handleReembolsoSubmit}
        montoSugerido={150} 
      />

      <ReemplazoModal
        isOpen={isReemplazoModalOpen}
        onClose={() => setIsReemplazoModalOpen(false)}
        onSubmit={handleReemplazoSubmit}
      />  
      </div>
    </div>
  );
}