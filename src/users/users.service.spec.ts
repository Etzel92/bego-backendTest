import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

/**
 * Servicio del dominio de Users
 * Contiene la lógica de negocio: creación con hash, validaciones de unicidad y operaciones CRUD.
 */
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async hashPassword(plain: string) {
    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
    const salt = await bcrypt.genSalt(rounds);
    return bcrypt.hash(plain, salt);
  }

  /**
   * Crea un usuario. Valida email único, encrypta password y oculta el campo en la respuesta
   */
  async create(dto: CreateUserDto) {
    const exists = await this.userModel.exists({ email: dto.email });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await this.hashPassword(dto.password);
    const user = new this.userModel({ ...dto, password: hashed });
    await user.save();
    const { password: password, ...rest } = user.toObject();
    return rest;
  }

  /**
   * Lista usuarios con paginación y filtro de búsqueda en name/email
   */
  async findAll(page = 1, limit = 20, search?: string) {
    const query: Record<string, unknown> = {};
    if (search) {
      query['$or'] = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca un usuario por id
   */
  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Busca por email. Si `withPassword` es true
   */
  async findByEmail(email: string, withPassword = false) {
    const q = this.userModel.findOne({ email });
    if (withPassword) q.select('+password');
    const user = await q.lean();
    return user;
  }

  /**
   * Actualiza un usuario. Si cambia email, si cambia password
   */
  async update(id: string, dto: UpdateUserDto) {
    if (dto.email) {
      const exists = await this.userModel.exists({
        email: dto.email,
        _id: { $ne: id },
      });
      if (exists) throw new ConflictException('Email already in use');
    }

    if (dto.password) {
      dto.password = await this.hashPassword(dto.password);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .lean();

    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.userModel.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('User not found');
    return { deleted: true };
  }
}
