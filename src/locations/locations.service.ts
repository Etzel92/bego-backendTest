import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.locationModel.syncIndexes();
  }

  private asObjectId(userId: string | null) {
    if (!userId) throw new UnauthorizedException('Token inválido: falta userId');
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('userId inválido en el token');
    }
    return new Types.ObjectId(userId);
  }

  private async resolvePlace(placeId: string) {
    const apiKey = this.config.get<string>('GOOGLE_PLACES_API_KEY');
    if (!apiKey) throw new BadRequestException('Falta GOOGLE_PLACES_API_KEY en .env');

    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = {
      place_id: placeId,
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

    return { address: addr, latitude: lat, longitude: lng };
  }

  async createFromPlaceId(userId: string | null, dto: CreateLocationDto) {
    const uid = this.asObjectId(userId);

    const existing = await this.locationModel.findOne({ user: uid, placeId: dto.placeId }).lean();
    if (existing) throw new ConflictException('La location ya existe para este usuario.');

    const resolved = await this.resolvePlace(dto.placeId);

    const doc = new this.locationModel({
      user: uid,
      placeId: dto.placeId,
      ...resolved,
    });

    try {
      return await doc.save();
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException('La location ya existe para este usuario.');
      throw e;
    }
  }

  async findAllByUser(userId: string | null, page = 1, limit = 10) {
    const uid = this.asObjectId(userId);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.locationModel
        .find({ user: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.locationModel.countDocuments({ user: uid }),
    ]);

    return { items, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  }

  async updateById(userId: string | null, id: string, dto: UpdateLocationDto) {
    const uid = this.asObjectId(userId);
    const set: any = {};

    if (dto.placeId) {
      const dup = await this.locationModel.findOne({
        user: uid,
        placeId: dto.placeId,
        _id: { $ne: id },
      }).lean();
      if (dup) throw new ConflictException('La location ya existe para este usuario.');

      const resolved = await this.resolvePlace(dto.placeId);
      set.placeId = dto.placeId;
      set.address  = resolved.address;
      set.latitude = resolved.latitude;
      set.longitude = resolved.longitude;

    } else if (dto.address) {
      set.address = dto.address;
    }

    try {
      const updated = await this.locationModel.findOneAndUpdate(
        { _id: id, user: uid },
        { $set: set },
        { new: true },
      );
      if (!updated) throw new NotFoundException('Location no encontrada');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException('La location ya existe para este usuario.');
      throw e;
    }
  }

  async removeById(userId: string | null, id: string) {
    const uid = this.asObjectId(userId);
    const res = await this.locationModel.deleteOne({ _id: id, user: uid });
    if (res.deletedCount === 0) throw new NotFoundException('Location no encontrada');
    return { deleted: true };
  }
}
