import { PartialType } from '@nestjs/swagger';
import { CreateDevolucionDto } from './create-devolucion.dto';

export class UpdateDevolucionDto extends PartialType(CreateDevolucionDto) {}
