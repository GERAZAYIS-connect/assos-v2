import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'marie@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+237690123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Secure@Pass1' })
  @IsString()
  password: string;
}
