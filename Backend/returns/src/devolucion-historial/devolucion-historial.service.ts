import { Injectable } from '@nestjs/common';
import { CreateDevolucionHistorialDto } from './dto/create-devolucion-historial.dto';
import { UpdateDevolucionHistorialDto } from './dto/update-devolucion-historial.dto';

@Injectable()
export class DevolucionHistorialService {
  create(createDevolucionHistorialDto: CreateDevolucionHistorialDto) {
    return 'This action adds a new devolucionHistorial';
  }

  findAll() {
    return `This action returns all devolucionHistorial`;
  }

  findOne(id: number) {
    return `This action returns a #${id} devolucionHistorial`;
  }

  update(id: number, updateDevolucionHistorialDto: UpdateDevolucionHistorialDto) {
    return `This action updates a #${id} devolucionHistorial`;
  }

  remove(id: number) {
    return `This action removes a #${id} devolucionHistorial`;
  }
}
