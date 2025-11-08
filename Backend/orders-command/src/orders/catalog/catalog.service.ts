import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';


export interface DetalleProducto {
        productoId: string;
        nombre: string;
        descripcion: string;
        imagen: string;
        // marca: string;
        // modelo?: string;
        
    }

@Injectable()
export class CatalogService {
    constructor(private readonly httpService: HttpService) {}


    
    async obtenerDetalles(productoIds: number[]): Promise<Record<string, DetalleProducto>> {
        const url = `${process.env.CATALOG_SERVICE_URL}/api/productos/detalles`;
        const response = await firstValueFrom(this.httpService.post<DetalleProducto[]>(url, productoIds ));
        const productos = response.data;

        return productos.reduce((acc, prod) => {
        acc[prod.productoId] = prod;
        return acc;
        }, {} as Record<string, DetalleProducto>);
    }
}
