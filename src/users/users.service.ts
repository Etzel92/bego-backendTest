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

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async hashPassword(plain: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  private deriveNameFromEmail(email: string): string {
    const local = (email ?? '').split('@')[0] ?? '';
    const cleaned = local.replace(/[._-]+/g, ' ').trim();
    if (!cleaned) return 'Usuario';
    return cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const exists = await this.userModel.exists({ email });
    if (exists) throw new ConflictException('Email already in use');

    const name =
      dto.name && dto.name.trim().length >= 3
        ? dto.name.trim()
        : this.deriveNameFromEmail(email);

    const hashed = await this.hashPassword(dto.password);

    const user = new this.userModel({
      name,
      email,
      password: hashed,
    });

    await user.save();

    const { password: _password, ...rest } = user.toObject();
    return rest;
  }

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

  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string, withPassword = false) {
    const q = this.userModel.findOne({ email: email.toLowerCase() });
    if (withPassword) q.select('+password');
    const user = await q.lean();
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.userModel.exists({
        email,
        _id: { $ne: id },
      });
      if (exists) throw new ConflictException('Email already in use');
      dto.email = email;
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
