import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization ?? null;

    if (!authHeader) {
      throw new UnauthorizedException('Falta el header Authorization');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token inválido o ausente');
    }

    try {
      // Validar el token con tu microservicio de autenticación
      const response = await axios.get<{ user: unknown }>(
        `${process.env.AUTH_SERVICE_URL}/validate-token`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // El Auth Service debería responder con los datos del usuario
      (request as Request & { user: unknown }).user = response.data.user;
      return true;
    } catch {
      throw new UnauthorizedException('Token no válido o expirado');
    }
  }
}
