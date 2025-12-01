# Dockerfile para desarrollo

# FROM node:22-alpine

# # Directorio de trabajo
# WORKDIR /app

# # Copiamos solo los package.json primero para cachear dependencias
# COPY package*.json ./

# # Instalamos dependencias
# RUN npm install

# # Copiamos el resto del código
# COPY . .

# # Exponemos puerto de NestJS
# EXPOSE 3000

# # Comando de inicio en modo desarrollo
# CMD ["npm", "run", "start:dev"]




# # Etapa 1: build
# FROM node:22-alpine AS builder

# WORKDIR /app

# # Copiamos manifest primero para aprovechar la cache
# COPY package.json package-lock.json* ./

# # Instalamos dependencias
# RUN npm ci

# # Copiamos el resto del código
# COPY . .

# # Build de la app NestJS
# RUN npm run build

# # Etapa 2: runtime
# FROM node:22-alpine AS runner

# WORKDIR /app

# # Copiamos solo lo necesario para runtime
# COPY package.json package-lock.json* ./
# RUN npm ci --omit=dev

# # Copiamos el dist generado en la etapa de build
# COPY --from=builder /app/dist ./dist

# # Exponer el puerto NestJS (normalmente 3000)
# EXPOSE 3000

# # Comando de inicio
# CMD ["node", "dist/src/main"]

# Dockerfile para producción 
FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos solo los package.json primero para cachear dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install 

# Copiamos el resto del código
COPY . .

# Compilamos el proyecto NestJS
RUN npm run build

# Exponemos el puerto que usará Cloud Run
EXPOSE 8080

# Comando de inicio en modo producción
CMD ["node", "dist/main.js"]
