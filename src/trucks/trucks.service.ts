import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { Truck, TruckDocument } from './schemas/truck.schema';

@Injectable()
export class TrucksService {
  constructor(
    @InjectModel(Truck.name) private readonly truckModel: Model<TruckDocument>,
  ) {}

  async create(dto: CreateTruckDto): Promise<Truck> {
    try {
      const created = await this.truckModel.create({
        ...dto,
        plates: dto.plates?.toUpperCase(),
      });
      return created.toJSON();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Las placas ya existen');
      }
      throw new BadRequestException(
        err?.message ?? 'No se pudo crear el truck',
      );
    }
  }

  async findAll(): Promise<Truck[]> {
    const items = await this.truckModel
      .find()
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    return items as unknown as Truck[];
  }

  async findOne(id: string): Promise<Truck> {
    const truck = await this.truckModel.findById(id).lean({ virtuals: true });
    if (!truck) throw new NotFoundException('Truck no encontrado');
    return truck as unknown as Truck;
  }

  async update(id: string, dto: UpdateTruckDto): Promise<Truck> {
    try {
      const updated = await this.truckModel
        .findByIdAndUpdate(
          id,
          {
            ...dto,
            ...(dto.plates ? { plates: dto.plates.toUpperCase() } : {}),
          },
          { new: true, runValidators: true },
        )
        .lean({ virtuals: true });

      if (!updated) throw new NotFoundException('Truck no encontrado');
      return updated as unknown as Truck;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Las placas ya existen');
      }
      throw new BadRequestException(
        err?.message ?? 'No se pudo actualizar el truck',
      );
    }
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.truckModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Truck no encontrado');
    return { deleted: true };
  }
}
