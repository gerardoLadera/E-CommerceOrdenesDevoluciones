import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../../components/Button";

// ****************************************************************************
// URL REAL DE TU SERVICIO DE DEVOLUCIONES
const API_URL_RETURNS = "http://localhost:3003/devolucion";
// ****************************************************************************

// ============================================================================
// DATOS SIMULADOS Y TYPES
// ============================================================================

type ActionType = "Reembolso" | "Reemplazo" | null;

interface ItemReturn {
  producto_id: string; // Usado como producto_id_dev
  nombre: string;
  descripcion: string;
  cantidadDisponible: number;
  precioUnitario: number; // Usado como precio_unitario_dev
  subTotal: number;
}

interface ItemSeleccionado {
  producto_id: string;
  cantidad: number; // Usado como cantidad_dev
  tipoAccion: ActionType; // Usado como tipo_accion
  motivo: string;
  articuloNuevo: string; // Nombre del nuevo artículo
  precioNuevo: string; // Precio del nuevo artículo (Input string, debe usar coma)
}

interface CatalogoItem {
  id: string;
  nombre: string;
  precio: number;
}

const CATALAGO_TOTAL: CatalogoItem[] = [
  { id: "PROD-201", nombre: "Audífonos Inalámbricos Pro-G", precio: 150.0 },
  { id: "PROD-202", nombre: "Teclado Mecánico RGB Modelo 5", precio: 95.5 },
  { id: "PROD-203", nombre: "Mouse Óptico Ergonómico X10", precio: 45.9 },
  { id: "PROD-204", nombre: "Monitor Curvo UltraHD 27''", precio: 499.0 },
  { id: "PROD-205", nombre: "Webcam Full HD con Micrófono", precio: 65.0 },
];

// FUNCIÓN CRÍTICA: Convierte el valor de input regional (ej: "1.200,50") a número JS (1200.50)
const parseRegionalFloat = (regionalString: string): number => {
  if (!regionalString) return NaN;
  // 1. Reemplazar puntos (separador de miles) por vacío
  // 2. Reemplazar la coma (separador decimal) por un punto
  const cleanString = regionalString.replace(/\./g, "").replace(/,/g, ".");
  return parseFloat(cleanString);
};

// Helper para formatear precio con coma como separador decimal (es-CL/es-PE)
const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "decimal",
    minimumFractionDigits: 2,
  }).format(value);
};

// COMPONENTE: ArticuloNuevoBuscador
interface ArticuloNuevoBuscadorProps {
  producto_id: string;
  isReplaceAction: boolean;
  onSelectArticulo: (
    producto_id: string,
    nombre: string,
    precio: number
  ) => void;
  currentNombre: string;
}

const ArticuloNuevoBuscador: React.FC<ArticuloNuevoBuscadorProps> = ({
  producto_id,
  isReplaceAction,
  onSelectArticulo,
  currentNombre,
}) => {
  const [searchTerm, setSearchTerm] = useState(currentNombre);
  const [searchResults, setSearchResults] = useState<CatalogoItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Función de búsqueda simulada
  const handleSearch = (query: string) => {
    setSearchTerm(query);

    if (query.length > 0) {
      const results = CATALAGO_TOTAL.filter(
        item =>
          item.nombre.toLowerCase().includes(query.toLowerCase()) ||
          item.id.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    // Si el usuario borra la búsqueda, borramos la selección externa (nombre y precio)
    if (query === "") {
      onSelectArticulo(producto_id, "", 0);
    }
  };

  const handleSelect = (item: CatalogoItem) => {
    setSearchTerm(item.nombre);
    setShowDropdown(false);
    onSelectArticulo(producto_id, item.nombre, item.precio);
  };

  React.useEffect(() => {
    setSearchTerm(currentNombre);
  }, [currentNombre]);

  return (
    <div className="relative">
      <input
        type="text"
        className={`w-full p-1 border rounded text-sm ${
          isReplaceAction ? "bg-white" : "bg-gray-100 cursor-not-allowed"
        }`}
        value={searchTerm}
        onChange={e => handleSearch(e.target.value)}
        disabled={!isReplaceAction}
        placeholder={isReplaceAction ? "Buscar Artículo por Nombre/ID" : ""}
        onFocus={() => {
          if (
            isReplaceAction &&
            searchTerm.length > 0 &&
            searchResults.length > 0
          )
            setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      {/* Desplegable de Resultados */}
      {showDropdown && isReplaceAction && (
        <ul className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg mt-1">
          {searchResults.length > 0 ? (
            searchResults.map(item => (
              <li
                key={item.id}
                className="p-2 text-sm hover:bg-gray-200 cursor-pointer"
                onMouseDown={() => handleSelect(item)}
              >
                <div className="font-semibold">{item.nombre}</div>
                <div className="text-xs text-gray-500">
                  ID: {item.id} | Precio: S/.{formatPrice(item.precio)}
                </div>
              </li>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">
              Escribe para buscar...
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// PAGINA PRINCIPAL: CREAR DEVOLUCIÓN
// ============================================================================
export default function CrearDevolucionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const ordenInicial = location.state?.ordenInicial;

  if (!ordenInicial) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        No se recibió información de la orden.
        <button
          onClick={() => navigate("/ordenes/ordenes")}
          className="mt-4 underline text-blue-600"
        >
          Regresar
        </button>
      </div>
    );
  }

  // Inicializar el estado de items seleccionados
  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    ItemSeleccionado[]
  >(
    ordenInicial.itemsOrden.map((item: ItemReturn) => ({
      producto_id: item.producto_id,
      cantidad: 0,
      tipoAccion: null,
      motivo: "",
      articuloNuevo: "",
      precioNuevo: "",
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para deshabilitar el botón

  // === HANDLERS ===

  const handleCantidadChange = (
    producto_id: string,
    cantidad: number,
    max: number
  ) => {
    if (cantidad < 0 || cantidad > max) return;

    setItemsSeleccionados(prev => {
      const updatedItems = prev.map(i =>
        i.producto_id === producto_id ? { ...i, cantidad } : i
      );

      if (cantidad === 0) {
        return updatedItems.map(i =>
          i.producto_id === producto_id
            ? {
                ...i,
                tipoAccion: null,
                motivo: "",
                articuloNuevo: "",
                precioNuevo: "",
              }
            : i
        );
      }

      return updatedItems;
    });
  };

  const handleMotivoChange = (producto_id: string, motivo: string) => {
    setItemsSeleccionados(prev =>
      prev.map(i => (i.producto_id === producto_id ? { ...i, motivo } : i))
    );
  };

  /**
   * Actualiza el artículo nuevo (nombre) y el precio nuevo
   * al seleccionar un ítem del buscador.
   */
  const handleSelectArticulo = (
    producto_id: string,
    nombre: string,
    precio: number
  ) => {
    // Buscar el ID del producto nuevo seleccionado en el catálogo
    const nuevoArticulo = CATALAGO_TOTAL.find(item => item.nombre === nombre);

    // Convertir el precio numérico a string en formato regional (ej: 95.50 -> "95,50")
    const precioString = precio > 0 ? formatPrice(precio) : "";

    setItemsSeleccionados(prev =>
      prev.map(i =>
        i.producto_id === producto_id
          ? {
              ...i,
              articuloNuevo: nombre,
              precioNuevo: precioString, // Usamos el formato regional para el input
              // Si necesitas almacenar el ID del nuevo artículo en el estado
              // Puedes extender ItemSeleccionado con `articuloNuevoId: string` y actualizarlo aquí.
              // Por ahora, asumiremos que se buscará en el payload final si es necesario.
            }
          : i
      )
    );
  };

  // CORRECCIÓN CLAVE EN EL HANDLER DE PRECIO NUEVO
  const handlePrecioNuevoChange = (
    producto_id: string,
    precioNuevo: string
  ) => {
    const itemOriginal = ordenInicial.itemsOrden.find(
      (i: ItemReturn) => i.producto_id === producto_id
    );
    const precioUnitarioOriginal = itemOriginal?.precioUnitario || 0;

    // Usamos la función de limpieza para obtener el valor numérico
    const nuevoValorNumerico = parseRegionalFloat(precioNuevo);

    // Permite que el campo esté vacío o que el valor sea >= precio original
    if (
      precioNuevo === "" ||
      isNaN(nuevoValorNumerico) ||
      nuevoValorNumerico >= precioUnitarioOriginal
    ) {
      setItemsSeleccionados(prev =>
        prev.map(i =>
          i.producto_id === producto_id ? { ...i, precioNuevo } : i
        )
      );
    }
  };

  const handleActionChange = (producto_id: string, value: string) => {
    const tipoAccion: ActionType = value === "" ? null : (value as ActionType);

    setItemsSeleccionados(prev =>
      prev.map(i => {
        if (i.producto_id === producto_id) {
          let newCantidad = i.cantidad;
          let newMotivo = i.motivo;
          let newArticuloNuevo = i.articuloNuevo;
          let newPrecioNuevo = i.precioNuevo;

          if (tipoAccion !== null && i.cantidad === 0) {
            newCantidad = 1;
          }

          if (tipoAccion === null) {
            newCantidad = 0;
            newMotivo = "";
            newArticuloNuevo = "";
            newPrecioNuevo = "";
          } else if (tipoAccion === "Reembolso") {
            newArticuloNuevo = "";
            newPrecioNuevo = "";
          }

          return {
            ...i,
            tipoAccion: tipoAccion,
            cantidad: newCantidad,
            motivo: newMotivo,
            articuloNuevo: newArticuloNuevo,
            precioNuevo: newPrecioNuevo,
          };
        }
        return i;
      })
    );
  };

  // === LÓGICA DE CÁLCULO Y FORMATO ===

  /**
   * Calcula el Monto Total basado en el tipo de acción.
   */
  const calculateMontoTotal = (
    item: ItemReturn,
    selectedItem: ItemSeleccionado
  ): number => {
    const cantidad = selectedItem.cantidad;
    const precioOriginal = item.precioUnitario;
    const tipo = selectedItem.tipoAccion;

    //USAMOS parseRegionalFloat para obtener el valor real del input
    const precioNuevo = parseRegionalFloat(selectedItem.precioNuevo);

    if (cantidad === 0 || tipo === null) {
      return 0;
    }

    if (tipo === "Reembolso") {
      return precioOriginal * cantidad;
    }

    if (tipo === "Reemplazo") {
      if (isNaN(precioNuevo)) {
        return 0;
      }
      return (precioNuevo - precioOriginal) * cantidad;
    }

    return 0;
  };

  // === SUBMIT, PREPARACIÓN DE JSON Y LLAMADA A LA API ===

  const handleSubmit = async () => {
    // 1. OBTENER DATOS FINALES Y VALIDACIONES BÁSICAS

    // Filtramos solo los ítems con cantidad > 0 y acción definida
    const itemsParaEnvio = itemsSeleccionados
      .filter(i => i.cantidad > 0 && i.tipoAccion !== null)
      .map(i => {
        const itemOriginal = ordenInicial.itemsOrden.find(
          (oi: ItemReturn) => oi.producto_id === i.producto_id
        );

        // Buscar el ID del producto nuevo si existe (basado en el nombre)
        const nuevoArticuloId = i.articuloNuevo
          ? CATALAGO_TOTAL.find(c => c.nombre === i.articuloNuevo)?.id
          : null;

        // Convertir precio nuevo a número para el envío final
        const precioNuevoNum = parseRegionalFloat(i.precioNuevo) || 0;

        return {
          itemOriginal, // Guardamos el original para precios/ID
          itemSeleccionado: i,
          precioNuevoNum,
          nuevoArticuloId,
        };
      });

    if (itemsParaEnvio.length === 0) {
      alert(
        "Debe seleccionar al menos un producto con una cantidad mayor a 0 y un Tipo de Acción."
      );
      return;
    }

    // 2. VALIDACIONES ADICIONALES (Motivo, Artículo Nuevo, Precio Nuevo)

    const itemsSinMotivo = itemsParaEnvio.filter(
      item => item.itemSeleccionado.motivo.trim() === ""
    );
    if (itemsSinMotivo.length > 0) {
      alert(
        "Debe especificar el motivo para todos los productos seleccionados para devolución/reemplazo."
      );
      return;
    }

    const itemsReemplazo = itemsParaEnvio.filter(
      item => item.itemSeleccionado.tipoAccion === "Reemplazo"
    );

    const itemsSinArticuloNuevo = itemsReemplazo.filter(
      item => item.itemSeleccionado.articuloNuevo.trim() === ""
    );
    if (itemsSinArticuloNuevo.length > 0) {
      alert(
        "Debe seleccionar un Artículo nuevo (usando el buscador) para todos los productos con 'Acción solicitada' como Reemplazo."
      );
      return;
    }

    const itemsConPrecioInvalido = itemsReemplazo.filter(
      item =>
        isNaN(item.precioNuevoNum) ||
        item.precioNuevoNum < item.itemOriginal!.precioUnitario
    );
    if (itemsConPrecioInvalido.length > 0) {
      alert(
        "El campo 'Precio nuevo (S/.)' debe ser un valor numérico válido y debe ser IGUAL O SUPERIOR al precio unitario pagado originalmente."
      );
      return;
    }

    // 3. CONSTRUCCIÓN DEL JSON FINAL (Payload)

    const finalItemsPayload = itemsParaEnvio.map(i => {
      const isReemplazo = i.itemSeleccionado.tipoAccion === "Reemplazo";

      const baseItem = {
        producto_id_dev: i.itemOriginal!.producto_id,
        cantidad_dev: i.itemSeleccionado.cantidad,
        precio_unitario_dev: i.itemOriginal!.precioUnitario,
        motivo: i.itemSeleccionado.motivo,
        tipo_accion: i.itemSeleccionado.tipoAccion!.toLowerCase(), // "reembolso" o "reemplazo"
      };

      if (isReemplazo) {
        // Asegúrate de que el producto_id_new sea el ID (ej: 102) y no el nombre (ej: "Mouse Óptico Ergonómico X10")
        // En tu ejemplo JSON, producto_id_new es numérico. Usaremos el ID del catálogo.
        const productoIdNew =
          i.nuevoArticuloId?.replace("PROD-", "") ||
          i.itemOriginal!.producto_id.replace("PROD-", "");

        return {
          ...baseItem,
          producto_id_new: parseInt(productoIdNew), // Convertir a número si el backend lo espera así
          precio_unitario_new: i.precioNuevoNum,
          cantidad_new: i.itemSeleccionado.cantidad,
        };
      }

      return baseItem;
    });

    const ordenIdParaEnvio = ordenInicial.ordenId;
    // UUID de ejemplo para pruebas, si ordenInicial.ordenId no funciona

    console.log(" Tipo de ordenId:", typeof ordenInicial.ordenId);
    console.log(" Valor de ordenId:", ordenInicial.ordenId);

    // Construir el payload completo que coincide con tu JSON de ejemplo
    const returnPayload = {
      orden_id: ordenInicial.ordenId,
      estado: "solicitado",
      items: finalItemsPayload,
    };

    console.log(
      "Datos a enviar para la devolución:",
      JSON.stringify(returnPayload, null, 2)
    );

    setIsSubmitting(true); // Deshabilitar el botón durante la petición

    // 4. LLAMADA AL SERVICIO DE DEVOLUCIONES
    try {
      const response = await fetch(API_URL_RETURNS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${tuToken}`, // Si usas autenticación
        },
        body: JSON.stringify(returnPayload),
      });

      if (!response.ok) {
        // Manejo de errores de la API (ej: 400, 500)
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMsg = `Error del servidor: ${errorData.message}`;
          }
        } catch (e) {
          // El error no era JSON, usamos el statusText
        }
        throw new Error(errorMsg);
      }

      // Devolución creada exitosamente
      const result = await response.json();
      console.log("Respuesta del servicio de devoluciones:", result);

      alert("Devolución generada correctamente.");
      // Navegar a la página de listado de devoluciones
      navigate("/ordenes/devoluciones");
    } catch (error) {
      console.error(" Error en la solicitud POST:", error);
      alert(
        `Ocurrió un error al intentar generar la devolución. Por favor, revise la consola para más detalles.`
      );
    } finally {
      setIsSubmitting(false); // Habilitar el botón nuevamente
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* ... (Encabezado y Datos del cliente) ... */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Generar Devolución
            <span className="ml-2 text-sm bg-gray-200 px-3 py-1 rounded-md font-semibold">
              Orden: {ordenInicial.codOrden}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            <h2 className="font-bold text-lg mb-3">Datos del Cliente</h2>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <div className="p-3 border-b border-gray-300 flex justify-between">
                <span className="font-semibold">ID Usuario</span>
                <span>{ordenInicial.datosCliente.usuarioId}</span>
              </div>
              <div className="p-3 border-b border-gray-300 flex justify-between">
                <span className="font-semibold">Nombre Completo</span>
                <span>{ordenInicial.datosCliente.nombreCompleto}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="font-semibold">Teléfono</span>
                <span>{ordenInicial.datosCliente.telefono}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <h2 className="font-bold text-lg mb-4">Confirmar</h2>
          {/* Botón modificado para usar el estado isSubmitting */}
          <Button
            text={isSubmitting ? "Generando..." : "Generar Devolución"}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-2 rounded-md font-semibold ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[#8b6d17ff] hover:opacity-90 text-white"
            }`}
          />
        </div>

        {/* ===================== ITEMS A DEVOLVER (lg:col-span-3) ===================== */}
        <div className="lg:col-span-3 bg-white p-5 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <h2 className="font-bold text-lg mb-3">Seleccionar Items</h2>

          <table className="w-full text-sm border border-gray-300 rounded-md overflow-hidden">
            <thead className="bg-[#C9B35E] text-black">
              <tr className="divide-x divide-gray-300">
                <th className="p-2 text-center font-semibold w-[10%]">
                  Acción solicitada
                </th>
                <th className="p-2 text-center font-semibold w-[16%]">
                  Motivo
                </th>
                <th className="p-2 text-center font-semibold w-[15%]">
                  Artículo devuelto
                </th>
                <th className="p-2 text-center font-semibold w-[7%]">
                  Cantidad devuelta
                </th>
                <th className="p-2 text-center font-semibold w-[10%]">
                  Precio pagado unit. (S/.)
                </th>
                <th className="p-2 text-center font-semibold w-[13%]">
                  Artículo nuevo
                </th>
                <th className="p-2 text-center font-semibold w-[10%]">
                  Precio nuevo (S/.)
                </th>
                <th className="p-2 text-center font-semibold w-[10%]">
                  Monto total (S/.)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {ordenInicial.itemsOrden.map((item: ItemReturn) => {
                const currentItemState = itemsSeleccionados.find(
                  i => i.producto_id === item.producto_id
                );
                const selectedCantidad = currentItemState?.cantidad ?? 0;
                const selectedActionValue = currentItemState?.tipoAccion ?? "";
                const selectedMotivo = currentItemState?.motivo ?? "";
                const selectedArticuloNuevo =
                  currentItemState?.articuloNuevo ?? "";
                const selectedPrecioNuevo = currentItemState?.precioNuevo ?? "";

                const isActionSelected = selectedActionValue !== "";
                const isReplaceAction = selectedActionValue === "Reemplazo";
                const isRefundAction = selectedActionValue === "Reembolso";

                const montoTotal = calculateMontoTotal(item, currentItemState!);

                let montoTextColor = "text-gray-800";
                if (isReplaceAction) {
                  montoTextColor = "text-green-600";
                } else if (isRefundAction) {
                  montoTextColor = "text-red-600";
                }

                return (
                  <tr
                    key={item.producto_id}
                    className="divide-x divide-gray-300"
                  >
                    {/* COLUMNA 1: Acción solicitada */}
                    <td className="p-2 text-center align-top">
                      <select
                        className={`w-full p-2 border rounded shadow-sm text-sm font-semibold
                          ${
                            isRefundAction
                              ? "bg-blue-50 border-blue-400 text-blue-800"
                              : isReplaceAction
                                ? "bg-green-50 border-green-400 text-green-800"
                                : "bg-white border-gray-300 text-gray-700"
                          }
                        `}
                        value={selectedActionValue}
                        onChange={e =>
                          handleActionChange(item.producto_id, e.target.value)
                        }
                      >
                        <option value="">Seleccionar acción</option>
                        <option value="Reembolso">Reembolso</option>
                        <option value="Reemplazo">Reemplazo</option>
                      </select>
                    </td>

                    {/* COLUMNA 2: Motivo */}
                    <td className="p-2 text-center align-top">
                      <textarea
                        rows={2}
                        className={`w-full p-1 border rounded text-sm ${
                          isActionSelected
                            ? "bg-white"
                            : "bg-gray-100 cursor-not-allowed"
                        }`}
                        value={selectedMotivo}
                        onChange={e =>
                          handleMotivoChange(item.producto_id, e.target.value)
                        }
                        disabled={!isActionSelected}
                        placeholder={
                          isActionSelected
                            ? "Escriba el motivo (Obligatorio)"
                            : "Seleccione una acción primero"
                        }
                      />
                    </td>

                    {/* COLUMNA 3: Artículo devuelto */}
                    <td className="p-2 align-top">
                      <div className="font-semibold">
                        {item.nombre}{" "}
                        <span className="text-gray-500 font-normal">
                          ({item.producto_id})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.descripcion}
                      </div>
                    </td>

                    {/* COLUMNA 4: Cantidad devuelta */}
                    <td className="p-2 text-center align-top">
                      <input
                        type="number"
                        min={0}
                        max={item.cantidadDisponible}
                        value={selectedCantidad}
                        className="w-16 p-1 border rounded text-center"
                        disabled={!isActionSelected}
                        onChange={e =>
                          handleCantidadChange(
                            item.producto_id,
                            Number(e.target.value),
                            item.cantidadDisponible
                          )
                        }
                      />
                    </td>

                    {/* COLUMNA 5: Precio pagado unit. (S/.) */}
                    <td className="p-2 text-center align-top font-semibold">
                      {formatPrice(item.precioUnitario)}
                    </td>

                    {/* COLUMNA 6: Artículo nuevo (Buscador) */}
                    <td className="p-2 text-center align-top">
                      <ArticuloNuevoBuscador
                        producto_id={item.producto_id}
                        isReplaceAction={isReplaceAction}
                        onSelectArticulo={handleSelectArticulo}
                        currentNombre={selectedArticuloNuevo}
                      />
                    </td>

                    {/* COLUMNA 7: Precio nuevo (S/.) - Acepta formato regional */}
                    <td className="p-2 text-center align-top">
                      <input
                        type="text" // Cambiado a text para manejar el formato de precio
                        className={`w-full p-1 border rounded text-center font-semibold ${
                          isReplaceAction
                            ? "bg-white"
                            : "bg-gray-100 cursor-not-allowed"
                        }`}
                        value={selectedPrecioNuevo}
                        onChange={e =>
                          handlePrecioNuevoChange(
                            item.producto_id,
                            e.target.value
                          )
                        }
                        disabled={!isReplaceAction}
                        placeholder={
                          isReplaceAction
                            ? `Mínimo: ${formatPrice(item.precioUnitario)}`
                            : ""
                        }
                      />
                    </td>

                    {/* COLUMNA 8: Monto total (S/.) */}
                    <td
                      className={`p-2 text-center align-top font-bold ${montoTextColor}`}
                    >
                      {formatPrice(montoTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
