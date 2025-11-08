import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import ConfirmationModal from "../../components/ConfimationModal";
import { useState } from "react";
import ReembolsoModal from "../../components/ReembolsoModal";
import ReemplazoModal from "../../components/ReemplazoModal";
import { getOrdenById  } from "../../modules/ordenes/api/ordenes";

interface ItemOrden {
  producto_id: string;
  precioUnitario: number;
  subTotal: number;
  cantidad: number;
  detalle_producto: {
    nombre: string;
    descripcion: string;
    imagen: string;
  };  
}

interface HistorialEstado {
  fechaModificacion: string;
  estadoNuevo: string;
  estadoAnterior: string;
  modificadoPor: string;
  motivo: string;
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


// Componente para infov
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
    queryFn: () => getOrdenById(idOrden!),
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
                <InfoField label="ID Usuario" value={orden.usuarioId} />
                <InfoField label="Nombre Completo" value={orden.direccionEnvio.nombreCompleto} />
                <InfoField label="Teléfono" value={orden.direccionEnvio.telefono} />
            </div>
          </div>
          {orden.estado !== "CANCELADO" && orden.estado !== "CREADO" && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h2 className="font-bold text-lg mb-2">Datos de pago</h2>
              <div className="border rounded-md overflow-hidden">
                  <InfoField label="ID Pago" value={orden.pago.pago_id } />
                  <InfoField label="Método pago" value={orden.pago.metodo} />
                  <InfoField label="Estado" value={orden.pago.estado} />
                  <InfoField label="Fecha"
                    value={new Date(orden.pago.fecha_pago).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  />
                  {/* <InfoField label="Fecha" value={orden.pago.fecha_pago} /> */}
              </div>
            </div>
          )}
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg mb-2">Datos de Envío</h2>
            <div className="border rounded-md overflow-hidden">
                <InfoField label="Tipo de entrega" value={orden.entrega.tipo} />
                <InfoField label="País" value={orden.direccionEnvio.pais} />
                <InfoField label="Provincia" value={orden.direccionEnvio.provincia} />
                <InfoField label="Ciudad" value={orden.direccionEnvio.ciudad} />
                <InfoField label="Dirección de entrega" value={orden.direccionEnvio.direccionLinea1} />
                <InfoField label="N° Departamento" value={orden.direccionEnvio.direccionLinea2} />
                <InfoField label="Referencia" value={orden.direccionEnvio.referencia} />
                <InfoField label="Código postal" value={orden.direccionEnvio.codigoPostal} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
             <h2 className="font-bold text-lg mb-2">Historial de la orden</h2>
             <table className="w-full text-sm border">
                <thead style={{ backgroundColor: '#C9B35E' }}> 
                    <tr>
                        <th className="p-2 text-left font-semibold">Fecha y Hora</th>
                        <th className="p-2 text-left font-semibold">Estado Anterior</th>
                        <th className="p-2 text-left font-semibold">Estado Actual</th>
                        <th className="p-2 text-left font-semibold">Modificado por</th>
                        <th className="p-2 text-left font-semibold">Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    {orden.historialEstados.map((h:HistorialEstado, index:number) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{new Date(h.fechaModificacion).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                            </td>
                            <td className="p-2">{h.estadoAnterior}</td>
                            <td className="p-2">{h.estadoNuevo}</td>
                            <td className="p-2">{h.modificadoPor}</td>
                            <td className="p-2">{h.motivo}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Columna derecha para items. */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg mb-2">Items de la orden</h2>
            <table className="w-full text-sm border">
                <thead style={{ backgroundColor: '#C9B35E' }}> 
                    <tr>
                        <th className="p-2 text-left font-semibold">ID Item</th>
                        <th className="p-2 text-left font-semibold">Nombre producto</th>
                        {/* <th className="p-2 text-left font-semibold">Marca</th> */}
                        <th className="p-2 text-left font-semibold">Cantidad</th>
                        <th className="p-2 text-left font-semibold">Precio Unitario</th>
                        <th className="p-2 text-left font-semibold">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {orden.items.map((item:ItemOrden) => (
                        <tr key={item.producto_id} className="border-b">
                            <td className="p-2">{item.producto_id}</td>
                            <td className="p-2">{item.detalle_producto.nombre}</td>
                            {/* <td className="p-2">{item.detalle_producto.marca}</td> */}
                            <td className="p-2 text-center">{item.cantidad}</td>
                            <td className="p-2">${item.precioUnitario.toFixed(2)}</td>
                            <td className="p-2">${item.subTotal.toFixed(2)}</td>
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