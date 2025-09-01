import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ObjectIdPipe } from 'src/common/pipes/object-id.pipe';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TrucksService } from './trucks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiTags('trucks')
@ApiBearerAuth('bearer')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateTruckDto) {
    return this.trucksService.create(dto);
  }

  @Get()
  findAll() {
    return this.trucksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.trucksService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Param('id', ObjectIdPipe) id: string, @Body() dto: UpdateTruckDto) {
    return this.trucksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.trucksService.remove(id);
  }
}
