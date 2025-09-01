/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear usuarios
 * 'name' es opcional. Si no se envía, se derivará del email en el servicio.
 */
export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({ description: 'Correo electrónico' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Contraseña', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
