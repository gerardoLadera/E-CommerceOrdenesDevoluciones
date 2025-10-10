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
import { ReemplazoService } from './reemplazo.service';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { UpdateReemplazoDto } from './dto/update-reemplazo.dto';

@Controller('reemplazo')
export class ReemplazoController {
  constructor(private readonly reemplazoService: ReemplazoService) {}

  @Post()
  create(@Body() createReemplazoDto: CreateReemplazoDto) {
    return this.reemplazoService.create(createReemplazoDto);
  }

  @Get()
  findAll() {
    return this.reemplazoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reemplazoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReemplazoDto: UpdateReemplazoDto,
  ) {
    return this.reemplazoService.update(id, updateReemplazoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reemplazoService.remove(id);
  }
}
