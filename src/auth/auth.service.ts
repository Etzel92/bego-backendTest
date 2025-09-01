import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async signup(dto: CreateUserDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');

    const user = await this.users.create(dto); // Devuelve user sin password
    const id =
      (user as any)?._id?.toString?.() ?? (user as any)?.id?.toString?.();
    return this.buildToken(id, (user as any).email, (user as any).role);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email, true); // con hash
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const id =
      (user as any)?._id?.toString?.() ?? (user as any)?.id?.toString?.();
    return this.buildToken(id, (user as any).email, (user as any).role);
  }

  private async buildToken(sub: string, email: string, role: string) {
    const payload = { sub, email, role };
    return { access_token: await this.jwt.signAsync(payload) };
  }
}
