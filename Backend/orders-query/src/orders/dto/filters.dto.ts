import { ApiPropertyOptional,ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetAllOrdersQueryDto {
    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsNumber()
    page: number = 1;

    @ApiProperty({ example: 9 })
    @Type(() => Number)
    @IsNumber()
    limit: number = 9;

    @ApiPropertyOptional({ description: 'Código de orden' })
    @IsOptional()
    busquedaId?: string;

    @ApiPropertyOptional({ description: 'Nombre del cliente' })
    @IsOptional()
    busquedaCliente?: string;

    @ApiPropertyOptional({ description: 'Estado de la orden' })
    @IsOptional()
    estado?: string;

    @ApiPropertyOptional({ description: 'Si tiene devolución (true/false)' })
    @IsOptional()
    tiene_devolucion?: string;

    @ApiPropertyOptional({ description: 'Fecha inicio (YYYY-MM-DD)' })
    @IsOptional()
    fechaInicio?: string;

    @ApiPropertyOptional({ description: 'Fecha fin (YYYY-MM-DD)' })
    @IsOptional()
    fechaFin?: string;
}
