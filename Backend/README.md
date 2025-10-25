# E-Commerce Ordenes y Devoluciones - Backend

Este proyecto es el backend para la gestión de órdenes y devoluciones en una plataforma de e-commerce.

## Características

- Gestión de órdenes de compra
- Procesamiento de devoluciones
- Arquitectura de microservicios (NestJS)
- Comunicación por Kafka
- Bases de datos PostgreSQL por servicio

## Tecnologías

- Node.js
- NestJS
- PostgreSQL
- Kafka
- Docker y Docker Compose

## Instalación y ejecución con Docker

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/E-CommerceOrdenesDevoluciones.git
   cd E-CommerceOrdenesDevoluciones/Backend
   ```

2. Levanta todos los servicios con Docker Compose:
   ```bash
   docker compose up --build
   ```

   Esto iniciará los microservicios (`orders-command`, `orders-query`, `returns`, `notifs`), Kafka, Zookeeper y las bases de datos PostgreSQL necesarias.

3. Accede a los servicios:
   - Orders Command: [http://localhost:3001](http://localhost:3001)
   - Orders Query: [http://localhost:3002](http://localhost:3002)
   - Returns: [http://localhost:3003](http://localhost:3003)
   - Notifs: [http://localhost:3004](http://localhost:3004)

## Baja de servicios
Para detener y eliminar los contenedores, redes y volúmenes creados por Docker Compose, ejecuta:
```bash
docker compose down -v --timeout 30
``` 

## Variables de entorno para los servicios

Nombrar : .env.development.local  y poner en carpeta de  cada servicio
KAFKA_BROKER=kafka:9092
DB_HOST=orders-db
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=orders
DB_PORT=5432

## Testing

### Ejecutar tests unitarios
```bash
cd returns
npm test
```

### Ejecutar tests con cobertura
```bash
npm test:cov
```

### Ejecutar tests E2E
```bash
npm test:e2e
```

### Verificar notificaciones
Ver la guía completa en [`returns/TESTING_NOTIFICATIONS.md`](returns/TESTING_NOTIFICATIONS.md)

## Endpoints principales

- `POST /orders` - Crear orden
- `GET /orders/:id` - Obtener orden
- `POST /devolucion` - Solicitar devolución
- `GET /devolucion` - Listar devoluciones
- `POST /reembolso` - Procesar reembolso

## Contribuir

1. Haz un fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz tus cambios y haz commit
4. Envía un pull request

## Licencia

MIT