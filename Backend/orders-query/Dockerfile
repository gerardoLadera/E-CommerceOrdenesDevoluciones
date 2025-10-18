# --- Etapa 1: Builder ---
# Usa una imagen base de Node.js con herramientas de compilación
FROM node:22-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de definición de paquetes
COPY package*.json ./

# Instala TODAS las dependencias (incluyendo devDependencies)
# Esto es crucial para que 'nest build' funcione
RUN npm install

# Copia el resto del código fuente de la aplicación
COPY . .

# Compila la aplicación TypeScript a JavaScript
RUN npm run build

# --- Etapa 2: Imagen Final de Producción ---
# Empieza con una imagen limpia de Node.js
FROM node:22-alpine

WORKDIR /app

# Copia solo los archivos de definición de paquetes nuevamente
COPY package*.json ./

# Instala ÚNICAMENTE las dependencias de producción
RUN npm install --omit=dev

# Copia los archivos compilados (dist) y las dependencias de producción 
# desde la etapa 'builder' anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expón el puerto correcto según tu .env (ej: 3002 para orders-query)
EXPOSE 3002 
# Asegúrate de que el puerto aquí coincida con el PORT en tu .env

# Comando para iniciar la aplicación compilada
CMD ["node", "dist/main"]