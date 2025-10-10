import { Injectable } from '@nestjs/common';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';

@Injectable()
export class DevolucionService {
  create(createDevolucionDto: CreateDevolucionDto) {
    return 'This action adds a new devolucion';
  }

  findAll() {
    return `This action returns all devolucion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} devolucion`;
  }

  update(id: number, updateDevolucionDto: UpdateDevolucionDto) {
    return `This action updates a #${id} devolucion`;
  }

  remove(id: number) {
    return `This action removes a #${id} devolucion`;
  }
}
