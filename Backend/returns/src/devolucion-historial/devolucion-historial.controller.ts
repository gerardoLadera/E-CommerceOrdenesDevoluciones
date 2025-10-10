import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DevolucionHistorialService } from './devolucion-historial.service';
import { CreateDevolucionHistorialDto } from './dto/create-devolucion-historial.dto';
import { UpdateDevolucionHistorialDto } from './dto/update-devolucion-historial.dto';

@Controller('devolucion-historial')
export class DevolucionHistorialController {
  constructor(
    private readonly devolucionHistorialService: DevolucionHistorialService,
  ) {}

  @Post()
  create(@Body() createDevolucionHistorialDto: CreateDevolucionHistorialDto) {
    return this.devolucionHistorialService.create(createDevolucionHistorialDto);
  }

  @Get()
  findAll() {
    return this.devolucionHistorialService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devolucionHistorialService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDevolucionHistorialDto: UpdateDevolucionHistorialDto,
  ) {
    return this.devolucionHistorialService.update(
      id,
      updateDevolucionHistorialDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devolucionHistorialService.remove(id);
  }
}
