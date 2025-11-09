import { PartialType } from '@nestjs/swagger';
import { CreateItemsDevolucionDto } from './create-items-devolucion.dto';

export class UpdateItemsDevolucionDto extends PartialType(
  CreateItemsDevolucionDto,
) {}
