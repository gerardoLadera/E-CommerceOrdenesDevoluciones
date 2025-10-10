import { Injectable } from '@nestjs/common';
import { CreateItemsDevolucionDto } from './dto/create-items-devolucion.dto';
import { UpdateItemsDevolucionDto } from './dto/update-items-devolucion.dto';

@Injectable()
export class ItemsDevolucionService {
  create(createItemsDevolucionDto: CreateItemsDevolucionDto) {
    return 'This action adds a new itemsDevolucion';
  }

  findAll() {
    return `This action returns all itemsDevolucion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} itemsDevolucion`;
  }

  update(id: number, updateItemsDevolucionDto: UpdateItemsDevolucionDto) {
    return `This action updates a #${id} itemsDevolucion`;
  }

  remove(id: number) {
    return `This action removes a #${id} itemsDevolucion`;
  }
}
