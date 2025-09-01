import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, isValidObjectId, Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { OrderStatus } from './enums/order-status.enum';

// Ajusta estos nombres si registraste tus modelos con otros 'name'
const MODEL = {
  USER: 'User',
  TRUCK: 'Truck',
  LOCATION: 'Location',
};

type JwtUser = { sub?: string; _id?: string; userId?: string; role?: string };

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  // Obtiene el ID de usuario sin importar si viene como sub, _id o userId
  private getUserId(auth: JwtUser): string {
    const id = auth?.sub ?? auth?._id ?? auth?.userId;
    if (!id) throw new ForbiddenException('No se pudo determinar el usuario autenticado');
    return id.toString();
  }

  private async ensureExists(modelName: string, id: string, label: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`${label} id inválido`);
    }
    const exists = await this.conn.model(modelName).exists({ _id: id });
    if (!exists) throw new NotFoundException(`${label} no encontrado`);
  }

  private isAdmin(user?: JwtUser) {
    return user?.role === 'admin';
  }

  private ensureOwnershipOrAdmin(order: OrderDocument, auth: JwtUser) {
    const uid = this.getUserId(auth);
    const isOwner = order.user.toString() === uid;
    if (!isOwner && !this.isAdmin(auth)) {
      throw new ForbiddenException('No tienes permisos sobre esta orden');
    }
  }

  async create(dto: CreateOrderDto, auth: JwtUser) {
    await this.ensureExists(MODEL.TRUCK, dto.truck, 'Truck');
    await this.ensureExists(MODEL.LOCATION, dto.pickup, 'Pickup location');
    await this.ensureExists(MODEL.LOCATION, dto.dropoff, 'Dropoff location');

    const ownerId = this.getUserId(auth);

    const created = await this.orderModel.create({
      user: new Types.ObjectId(ownerId),
      truck: new Types.ObjectId(dto.truck),
      pickup: new Types.ObjectId(dto.pickup),
      dropoff: new Types.ObjectId(dto.dropoff),
      status: (dto as any).status ?? OrderStatus.CREATED,
    });

    return created;
  }

  async findAll(q: OrdersQueryDto, auth: JwtUser) {
    const { page = 1, limit = 10, status, truck, user, expand = false } = q;

    const filter: FilterQuery<OrderDocument> = {};
    if (status) filter.status = status;
    if (truck) filter.truck = new Types.ObjectId(truck);

    const currentUserId = this.getUserId(auth);
    if (this.isAdmin(auth) && user) {
      filter.user = new Types.ObjectId(user);
    } else {
      filter.user = new Types.ObjectId(currentUserId);
    }

    const cursor = this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (expand) {
      cursor
        .populate({ path: 'user', select: 'name email role', model: MODEL.USER })
        .populate({ path: 'truck', model: MODEL.TRUCK })
        .populate({ path: 'pickup', model: MODEL.LOCATION })
        .populate({ path: 'dropoff', model: MODEL.LOCATION });
    }

    const [items, total] = await Promise.all([
      cursor.lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }

  async findOne(id: string, expand = true, auth?: JwtUser) {
    if (!isValidObjectId(id)) throw new BadRequestException('Id inválido');

    const query = this.orderModel.findById(id);
    if (expand) {
      query
        .populate({ path: 'user', select: 'name email role', model: MODEL.USER })
        .populate({ path: 'truck', model: MODEL.TRUCK })
        .populate({ path: 'pickup', model: MODEL.LOCATION })
        .populate({ path: 'dropoff', model: MODEL.LOCATION });
    }

    const order = await query.exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (auth) this.ensureOwnershipOrAdmin(order, auth);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, auth: JwtUser) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');
    this.ensureOwnershipOrAdmin(order, auth);

    if (dto.truck) await this.ensureExists(MODEL.TRUCK, dto.truck, 'Truck');
    if (dto.pickup) await this.ensureExists(MODEL.LOCATION, dto.pickup, 'Pickup location');
    if (dto.dropoff) await this.ensureExists(MODEL.LOCATION, dto.dropoff, 'Dropoff location');

    // status se cambia en endpoint dedicado
    const { status, ...rest } = dto as any;
    Object.assign(order, rest);

    await order.save();
    return order;
  }

  async changeStatus(id: string, { status }: ChangeStatusDto, auth: JwtUser) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    this.ensureOwnershipOrAdmin(order, auth);

    const nexts = ALLOWED_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!nexts.includes(status)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${status}`,
      );
    }

    order.status = status;
    await order.save();
    return order;
  }

  async remove(id: string, auth: JwtUser) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');
    this.ensureOwnershipOrAdmin(order, auth);
    await order.deleteOne();
    return { deleted: true };
  }

  /**
   * Aggregation: conteo por estatus (admin: global; user normal: solo sus órdenes)
   */
  async statsByStatus(auth: JwtUser) {
    const uid = this.getUserId(auth);
    const match: Record<string, any> = this.isAdmin(auth)
      ? {}
      : { user: new Types.ObjectId(uid) };

    return this.orderModel
      .aggregate()
      .match(match) // $match
      .group({ _id: '$status', total: { $sum: 1 } }) // $group
      .project({ _id: 0, status: '$_id', total: 1 }) // $project
      .sort({ status: 1 }) // $sort
      .exec();
  }
}
