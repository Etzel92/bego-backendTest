import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva orden' })
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes (paginado + filtros)' })
  findAll(@Query() q: OrdersQueryDto, @Req() req: any) {
    return this.ordersService.findAll(q, req.user);
  }

  @Get('stats/status')
  @ApiOperation({ summary: 'Aggregation: conteo por estatus' })
  stats(@Req() req: any) {
    return this.ordersService.statsByStatus(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una orden' })
  @ApiQuery({ name: 'expand', required: false, type: Boolean })
  findOne(@Param('id') id: string, @Query('expand') expand: string, @Req() req: any) {
    const ex = expand === 'true' || expand === '1' || expand === 'on';
    return this.ordersService.findOne(id, ex, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar (truck/pickup/dropoff)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Req() req: any) {
    return this.ordersService.update(id, dto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estatus (created → in_transit → completed)' })
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
    return this.ordersService.changeStatus(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una orden' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.remove(id, req.user);
  }
}
