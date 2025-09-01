import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UserId } from '../auth/decorators/user-id.decorator';

@ApiTags('Locations')
@ApiBearerAuth('bearer')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@UserId() userId: string, @Body() dto: CreateLocationDto) {
    return this.locationsService.createFromPlaceId(userId, dto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(@UserId() userId: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.locationsService.findAllByUser(userId, Number(page), Number(limit));
  }

  @Patch(':id')
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.updateById(userId, id, dto);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.locationsService.removeById(userId, id);
  }
}
