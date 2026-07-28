import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'marie@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+237690123456' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email, { message: 'Either email or phone is required' })
  phone?: string;

  @ApiProperty({ example: 'Secure@Pass1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
