import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmedOrderDto {

    @ApiProperty({ example: 'admin-user-001', description: 'Usuario admin que confirma la orden' })
    @IsString()
    usuario: string;
}