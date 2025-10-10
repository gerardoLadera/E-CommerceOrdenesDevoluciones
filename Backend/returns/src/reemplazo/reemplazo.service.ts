import { Injectable } from '@nestjs/common';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { UpdateReemplazoDto } from './dto/update-reemplazo.dto';

@Injectable()
export class ReemplazoService {
  create(createReemplazoDto: CreateReemplazoDto) {
    return 'This action adds a new reemplazo';
  }

  findAll() {
    return `This action returns all reemplazo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reemplazo`;
  }

  update(id: number, updateReemplazoDto: UpdateReemplazoDto) {
    return `This action updates a #${id} reemplazo`;
  }

  remove(id: number) {
    return `This action removes a #${id} reemplazo`;
  }
}
