import { PartialType } from '@nestjs/swagger';
import { CreateReemplazoDto } from './create-reemplazo.dto';

export class UpdateReemplazoDto extends PartialType(CreateReemplazoDto) {}
