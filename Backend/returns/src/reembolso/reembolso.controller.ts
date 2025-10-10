import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReembolsoService } from './reembolso.service';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { UpdateReembolsoDto } from './dto/update-reembolso.dto';

@Controller('reembolso')
export class ReembolsoController {
  constructor(private readonly reembolsoService: ReembolsoService) {}

  @Post()
  create(@Body() createReembolsoDto: CreateReembolsoDto) {
    return this.reembolsoService.create(createReembolsoDto);
  }

  @Get()
  findAll() {
    return this.reembolsoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reembolsoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReembolsoDto: UpdateReembolsoDto) {
    return this.reembolsoService.update(+id, updateReembolsoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reembolsoService.remove(+id);
  }
}
