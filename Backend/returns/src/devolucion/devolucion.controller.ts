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
import { DevolucionService } from './devolucion.service';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';
import { UpdateDevolucionDto } from './dto/update-devolucion.dto';

@Controller('devolucion')
export class DevolucionController {
  constructor(private readonly devolucionService: DevolucionService) {}

  @Post(':id/approve')
  approveAndRefund(@Param('id', ParseUUIDPipe) id: string) {
    return this.devolucionService.approveAndRefund(id);
  }
  
  @Post()
  create(@Body() createDevolucionDto: CreateDevolucionDto) {
    return this.devolucionService.create(createDevolucionDto);
  }

  @Get()
  findAll() {
    return this.devolucionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devolucionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDevolucionDto: UpdateDevolucionDto,
  ) {
    return this.devolucionService.update(id, updateDevolucionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devolucionService.remove(id);
  }
}
