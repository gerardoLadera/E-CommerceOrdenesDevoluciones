import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ItemsDevolucionService } from './items-devolucion.service';
import { CreateItemsDevolucionDto } from './dto/create-items-devolucion.dto';
import { UpdateItemsDevolucionDto } from './dto/update-items-devolucion.dto';

@Controller('items-devolucion')
export class ItemsDevolucionController {
  constructor(
    private readonly itemsDevolucionService: ItemsDevolucionService,
  ) {}

  @Post()
  create(@Body() createItemsDevolucionDto: CreateItemsDevolucionDto) {
    return this.itemsDevolucionService.create(createItemsDevolucionDto);
  }

  @Get()
  findAll() {
    return this.itemsDevolucionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsDevolucionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemsDevolucionDto: UpdateItemsDevolucionDto,
  ) {
    return this.itemsDevolucionService.update(id, updateItemsDevolucionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsDevolucionService.remove(id);
  }
}
