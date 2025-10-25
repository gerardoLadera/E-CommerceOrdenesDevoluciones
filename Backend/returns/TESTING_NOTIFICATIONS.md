# Guía de Testing: Verificar Notificaciones al Cliente

## 📋 Objetivo
Verificar que se envíe una notificación al cliente cuando se crea una devolución.

---

## 🔬 1. Test Unitario (Ya Implementado)

### Archivo: `src/devolucion/devolucion.service.spec.ts`

**Qué verifica:**
- ✅ El servicio llama al método `emitReturnCreated` del KafkaProducerService
- ✅ Se envía el payload correcto con los datos de la devolución

**Ejecutar:**
```bash
npm test devolucion.service.spec
```

**Verificación:**
```typescript
expect(kafkaProducerService.emitReturnCreated).toHaveBeenCalledWith({
  eventType: 'return-created',
  data: mockDevolucion,
  timestamp: expect.any(String),
});
```

---

## 🧪 2. Test de Integración - KafkaProducerService

### Archivo: `src/common/kafka/kafkaprovider.service.spec.ts`

**Qué verifica:**
- ✅ El servicio de Kafka se conecta correctamente
- ✅ Los eventos se emiten al topic correcto (`return-created`)
- ✅ El payload contiene la información necesaria para notificar

**Ejecutar:**
```bash
npm test kafkaprovider.service.spec
```

---

## 🌐 3. Test E2E (End-to-End)

### Archivo: `test/devolucion-notification.e2e-spec.ts`

**Qué verifica:**
- ✅ El endpoint POST `/devolucion` crea la devolución
- ✅ Se emite el evento a Kafka automáticamente
- ✅ El evento NO se emite si la orden no existe
- ✅ La estructura del evento es correcta

**Ejecutar:**
```bash
npm test:e2e devolucion-notification
```

**Flujo probado:**
```
Cliente → API POST /devolucion → DevolucionService → KafkaProducer → Kafka Topic
```

---

## 🐳 4. Testing Manual con Docker Compose

### Opción A: Con Kafka UI (Recomendado)

1. **Agregar Kafka UI al `compose.yml`** (en la raíz del proyecto):

```yaml
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    ports:
      - "8080:8080"
    environment:
      - KAFKA_CLUSTERS_0_NAME=local
      - KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092
    depends_on:
      - kafka
    networks:
      - backend
```

2. **Levantar los servicios:**
```bash
docker compose up -d
```

3. **Acceder a Kafka UI:**
```
http://localhost:8080
```

4. **Crear una devolución:**
```bash
curl -X POST http://localhost:3003/devolucion \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "pendiente"
  }'
```

5. **Verificar en Kafka UI:**
   - Ir a `Topics` → `return-created`
   - Ver los mensajes recibidos
   - ✅ Verificar que aparece el evento con los datos de la devolución

---

### Opción B: Con Kafka Console Consumer

1. **Levantar servicios:**
```bash
docker compose up -d
```

2. **En otra terminal, escuchar el topic:**
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic return-created \
  --from-beginning
```

3. **Crear una devolución:**
```bash
curl -X POST http://localhost:3003/devolucion \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "pendiente"
  }'
```

4. **✅ Verificar:** Deberías ver el evento en el consumer:
```json
{
  "eventType": "return-created",
  "data": {
    "id": "...",
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "pendiente"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🔍 5. Testing con Postman/Insomnia

### Configuración de la Collection:

**1. Crear Devolución**
```
POST http://localhost:3003/devolucion
Content-Type: application/json

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "pendiente",
  "fecha_procesamiento": "2025-01-15T10:30:00Z"
}
```

**2. Verificar Logs del Servicio:**
```bash
docker logs returns -f
```

**✅ Deberías ver:**
```
[KafkaProducerService] Enviando evento Kafka con payload: {...}
[KafkaProducerService] Evento emitido a Kafka: return-created
```

---

## 📊 6. Verificación con el Servicio de Notificaciones

Si tienes el servicio `notifs` corriendo:

### 1. Verificar que el consumer está escuchando

```bash
docker logs notifs -f
```

### 2. Crear una devolución

```bash
curl -X POST http://localhost:3003/devolucion \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "pendiente"
  }'
```

### 3. ✅ Verificar en los logs de `notifs`:

Deberías ver que el servicio recibe y procesa el evento:
```
[NotificationsService] Received event: return-created
[NotificationsService] Sending notification to customer...
```

---

## 🎯 Checklist de Verificación

### Tests Automatizados
- [ ] Test unitario de DevolucionService pasa
- [ ] Test unitario de KafkaProducerService pasa
- [ ] Test E2E pasa
- [ ] Coverage > 80%

### Tests Manuales
- [ ] Kafka UI muestra el evento en el topic `return-created`
- [ ] El consumer de consola recibe el mensaje
- [ ] Los logs muestran "Evento emitido a Kafka"
- [ ] El servicio de notificaciones recibe el evento
- [ ] El payload contiene todos los campos necesarios:
  - `eventType`
  - `data.id`
  - `data.orderId`
  - `data.estado`
  - `timestamp`

---

## 🚀 Comandos Rápidos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests de notificaciones
npm test -- --testNamePattern="notification"

# Tests con cobertura
npm test:cov

# Test E2E
npm test:e2e

# Ver logs en tiempo real
docker logs returns -f

# Limpiar y reiniciar
docker compose down -v
docker compose up --build
```

---

## 📝 Estructura del Evento de Notificación

```typescript
{
  "eventType": "return-created",
  "data": {
    "id": "uuid-de-la-devolucion",
    "orderId": "uuid-de-la-orden",
    "estado": "pendiente",
    "fecha_solicitud": "2025-01-15T10:30:00.000Z",
    // Otros campos de la devolución...
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🐛 Troubleshooting

### El evento no se emite

**Problema:** No ves el evento en Kafka

**Soluciones:**
1. Verificar que Kafka está corriendo: `docker ps | grep kafka`
2. Ver logs del servicio: `docker logs returns -f`
3. Verificar conexión Kafka: `docker logs kafka`
4. Reiniciar servicios: `docker compose restart`

### Error de conexión a Kafka

**Problema:** `Error: Connection to Kafka failed`

**Soluciones:**
1. Verificar variable de entorno `KAFKA_BROKER`
2. Verificar que Kafka está en la misma red Docker
3. Esperar a que Kafka esté completamente iniciado (healthcheck)

---

## 📚 Referencias

- [NestJS Microservices - Kafka](https://docs.nestjs.com/microservices/kafka)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Testing NestJS Apps](https://docs.nestjs.com/fundamentals/testing)
