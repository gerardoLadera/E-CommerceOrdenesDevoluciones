import { PartialType } from '@nestjs/mapped-types';
import { CreateReembolsoDto } from './create-reembolso.dto';

export class UpdateReembolsoDto extends PartialType(CreateReembolsoDto) {}
