import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EvidenciaEntregaDto {
    @ApiPropertyOptional({ example: 'FOTO', description: 'Tipo de evidencia (FOTO, HORA , etc.)' })
    @IsString()
    tipo: string;

    @ApiPropertyOptional({ example: 'https://cdn.miapp.com/entregas/orden123.jpg', description: 'Valor de la evidencia' })
    @IsString()
    valor: string;
    }

    export class EntregarOrderDto {
    @ApiPropertyOptional({ example: 'Orden entregada al cliente en dirección registrada' })
    @IsOptional()
    @IsString()
    mensaje?: string;

    @ApiPropertyOptional({ type: [EvidenciaEntregaDto], description: 'Lista de evidencias opcionales de entrega' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvidenciaEntregaDto)
    evidencias?: EvidenciaEntregaDto[];
}