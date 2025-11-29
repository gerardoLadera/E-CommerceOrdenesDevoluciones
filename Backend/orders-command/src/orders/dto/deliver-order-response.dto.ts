import { ApiProperty } from '@nestjs/swagger';

export class EntregarOrderResponseDto {
    @ApiProperty({ example: 'Orden notificada como ENTREGADA exitosamente' })
    message: string;
}