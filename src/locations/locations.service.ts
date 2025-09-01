import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async createFromPlaceId(userId: string, dto: CreateLocationDto) {
    // ¿Ya existe para este usuario?
    const existing = await this.locationModel.findOne({ user: userId, placeId: dto.placeId }).lean();
    if (existing) {
      throw new ConflictException('La location ya existe para este usuario.');
    }

    const apiKey = this.config.get<string>('GOOGLE_PLACES_API_KEY');
    if (!apiKey) throw new BadRequestException('Falta GOOGLE_PLACES_API_KEY en .env');

    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = {
      place_id: dto.placeId,
      fields: 'formatted_address,geometry/location',
      key: apiKey,
    };

    const { data } = await firstValueFrom(this.http.get(url, { params }));
    if (data?.status !== 'OK' || !data?.result) {
      throw new BadRequestException(`No se pudo resolver placeId (${data?.status ?? 'sin status'})`);
    }

    const addr: string = data.result.formatted_address;
    const lat: number = data.result.geometry?.location?.lat;
    const lng: number = data.result.geometry?.location?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new BadRequestException('Respuesta Places inválida: falta geometry.location');
    }

    const doc = new this.locationModel({
      user: new Types.ObjectId(userId),
      address: addr,
      placeId: dto.placeId,
      latitude: lat,
      longitude: lng,
    });

    return await doc.save();
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.locationModel.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.locationModel.countDocuments({ user: userId }),
    ]);
    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(userId: string, id: string, dto: UpdateLocationDto) {
    const updated = await this.locationModel.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { ...(dto.address ? { address: dto.address } : {}) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Location no encontrada');
    return updated;
  }

  async removeById(userId: string, id: string) {
    const res = await this.locationModel.deleteOne({ _id: id, user: userId });
    if (res.deletedCount === 0) throw new NotFoundException('Location no encontrada');
    return { deleted: true };
  }
}
