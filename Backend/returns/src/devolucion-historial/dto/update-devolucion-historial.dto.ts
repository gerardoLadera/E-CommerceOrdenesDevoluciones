import { PartialType } from '@nestjs/mapped-types';
import { CreateDevolucionHistorialDto } from './create-devolucion-historial.dto';

export class UpdateDevolucionHistorialDto extends PartialType(CreateDevolucionHistorialDto) {}
