# Módulo de Devoluciones

Módulo independiente para la gestión de devoluciones del sistema E-Commerce.

## 🌐 Configuración de API

Este módulo se conecta a su propio microservicio:

- **Desarrollo**: `http://localhost:3003`
- **Producción**: Configurar en `api/api.ts`

### Endpoints Base

Todos los endpoints del servicio de devoluciones comienzan con `/devolucion`:

```
http://localhost:3003/devolucion
```

## 📂 Estructura del Módulo

```
modules/devoluciones/
├── api/
│   ├── api.ts                        # Configuración de Axios
│   ├── devolucionService.ts          # Servicios de devoluciones
│   ├── reembolsoService.ts           # Servicios de reembolsos
│   ├── itemDevolucionService.ts      # Servicios de items
│   ├── reemplazoService.ts           # Servicios de reemplazos
│   └── historialService.ts           # Servicios de historial
├── types/
│   ├── enums.ts                      # Estados y constantes
│   └── devolucion.ts                 # Interfaces TypeScript
├── hooks/
│   ├── useDevoluciones.ts            # Hook de devoluciones
│   ├── useReembolsos.ts              # Hook de reembolsos
│   ├── useItemsDevoluciones.ts       # Hook de items
│   ├── useReemplazos.ts              # Hook de reemplazos
│   └── useHistorialDevoluciones.ts   # Hook de historial
├── utils/
│   └── formatters.ts                 # Funciones auxiliares
└── index.ts                          # Exportaciones públicas
```

## 🔌 Uso del Módulo

### Importaciones

```typescript
// Importar todo desde el índice
import {
  useDevoluciones,
  useReembolsos,
  useItemsDevoluciones,
  useReemplazos,
  useHistorialDevoluciones,
  EstadoDevolucion,
  devolucionService,
  reembolsoService,
  formatCurrency
} from '@/modules/devoluciones';

// O importaciones específicas
import { useDevoluciones } from '@/modules/devoluciones/hooks/useDevoluciones';
import { useReembolsos } from '@/modules/devoluciones/hooks/useReembolsos';
import { EstadoDevolucion } from '@/modules/devoluciones/types/enums';
```

### Ejemplo Básico

```typescript
import { useDevoluciones, EstadoDevolucion } from '@/modules/devoluciones';

function DevolucionesPage() {
  const {
    devoluciones,
    isLoading,
    aprobarDevolucion,
    rechazarDevolucion
  } = useDevoluciones();

  const handleAprobar = async (id: string) => {
    await aprobarDevolucion({
      id,
      data: {
        adminId: 1,
        comentario: 'Aprobada',
        metodoDevolucion: 'envio_domicilio'
      }
    });
  };

  return (
    <div>
      {devoluciones.map(dev => (
        <div key={dev.id}>
          {dev.id} - {dev.estado}
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Autenticación

El módulo incluye interceptores para manejar automáticamente:

- **Token JWT**: Se añade automáticamente desde `localStorage`
- **Redirección 401/403**: Redirige a `/login` en caso de no autorizado

## 📊 Estados de Devolución

```typescript
const EstadoDevolucion = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
} as const;
```

## 🎨 Utilidades Incluidas

### Formateo de Moneda
```typescript
import { formatCurrency } from '@/modules/devoluciones';

formatCurrency(1500, 'USD'); // "$1,500.00"
```

### Formateo de Fechas
```typescript
import { formatDate, formatDateShort } from '@/modules/devoluciones';

formatDate('2025-11-07T14:30:00Z');      // "7 de noviembre de 2025, 14:30"
formatDateShort('2025-11-07T14:30:00Z'); // "07/11/2025"
```

### Estilos de Estado
```typescript
import { getEstadoBadgeColor, getEstadoLabel } from '@/modules/devoluciones';

getEstadoBadgeColor('pendiente'); // 'warning'
getEstadoLabel('pendiente');      // 'Pendiente'
```

## 🔄 Operaciones Disponibles

El hook `useDevoluciones` proporciona:

### Consultas
- `devoluciones`: Array de todas las devoluciones
- `isLoading`: Estado de carga
- `error`: Errores de la petición
- `refetch`: Recargar datos

### Mutaciones
- `createDevolucion(data)`: Crear nueva
- `updateDevolucion({ id, data })`: Actualizar
- `aprobarDevolucion({ id, data })`: Aprobar
- `rechazarDevolucion({ id, data })`: Rechazar
- `completarDevolucion(id)`: Marcar como completada
- `cancelarDevolucion(id)`: Cancelar
- `eliminarDevolucion(id)`: Eliminar

### Estados de Mutación
- `isCreating`: Creando
- `isUpdating`: Actualizando
- `isAprobando`: Aprobando
- `isRechazando`: Rechazando

## 🌍 Variables de Entorno

No se requieren variables de entorno específicas. El módulo determina automáticamente el entorno:

```typescript
// En desarrollo
baseURL: "http://localhost:3003"

// En producción (import.meta.env.MODE === "production")
baseURL: "https://devoluciones-833583666995.us-central1.run.app"
```

## 📝 Tipos TypeScript

Todos los tipos están completamente tipados:

```typescript
interface Devolucion {
  id: string;
  orderId: string;
  createdAt: string;
  estado: EstadoDevolucion;
  fecha_procesamiento: string | null;
  orden_reemplazo_id: string | null;
  reembolso_id: string | null;
  reemplazo_id: string | null;
  historial?: DevolucionHistorial[];
  items?: ItemDevolucion[];
  reembolso?: Reembolso;
  reemplazo?: Reemplazo;
}
```

## 🔧 Mantenimiento

### Cambiar URL de Producción

Editar `modules/devoluciones/api/api.ts`:

```typescript
export const API_DEVOLUCIONES = axios.create({
  baseURL: import.meta.env.MODE === "production"
    ? "https://tu-nueva-url-de-produccion.com"
    : "http://localhost:3003",
  // ...
});
```

### Agregar Nuevos Endpoints

Editar `modules/devoluciones/api/devolucionService.ts`:

```typescript
export const devolucionService = {
  // ... endpoints existentes
  
  nuevoEndpoint: async (id: string): Promise<Tipo> => {
    const response = await API_DEVOLUCIONES.get<Tipo>(`/devolucion/${id}/nuevo`);
    return response.data;
  },
};
```

## 🐛 Troubleshooting

### Error: Cannot connect to API
- Verificar que el servicio esté corriendo en `localhost:3003`
- Comprobar CORS en el backend

### Error: 401 Unauthorized
- Verificar que el token esté en localStorage
- Comprobar validez del token

### TypeScript Errors
- Ejecutar `npm run type-check`
- Verificar que todas las importaciones usen rutas correctas

## 📚 Más Información

Ver la documentación completa en:
- [COMPONENTES_DEVOLUCIONES.md](../../COMPONENTES_DEVOLUCIONES.md)
- [FRONTEND_TYPES.md](../../FRONTEND_TYPES.md)
