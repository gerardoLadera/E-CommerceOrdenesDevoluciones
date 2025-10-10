import { PartialType } from '@nestjs/mapped-types';
import { CreateReemplazoDto } from './create-reemplazo.dto';

export class UpdateReemplazoDto extends PartialType(CreateReemplazoDto) {}
