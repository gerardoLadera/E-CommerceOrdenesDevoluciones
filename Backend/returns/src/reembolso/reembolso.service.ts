import { Injectable } from '@nestjs/common';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { UpdateReembolsoDto } from './dto/update-reembolso.dto';

@Injectable()
export class ReembolsoService {
  create(createReembolsoDto: CreateReembolsoDto) {
    return 'This action adds a new reembolso';
  }

  findAll() {
    return `This action returns all reembolso`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reembolso`;
  }

  update(id: number, updateReembolsoDto: UpdateReembolsoDto) {
    return `This action updates a #${id} reembolso`;
  }

  remove(id: number) {
    return `This action removes a #${id} reembolso`;
  }
}
