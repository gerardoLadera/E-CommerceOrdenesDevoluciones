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

