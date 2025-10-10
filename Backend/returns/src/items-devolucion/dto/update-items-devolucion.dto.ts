import { PartialType } from '@nestjs/mapped-types';
import { CreateItemsDevolucionDto } from './create-items-devolucion.dto';

export class UpdateItemsDevolucionDto extends PartialType(CreateItemsDevolucionDto) {}
