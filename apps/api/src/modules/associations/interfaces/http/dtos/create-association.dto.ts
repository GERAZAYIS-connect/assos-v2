import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssociationDto {
  @ApiProperty({ example: 'Mutuelle Les Collines', description: 'Full name of the association' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'les-collines',
    description: '3-30 chars, lowercase letters, digits and hyphens only',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, {
    message: 'slug must be 3-30 characters, lowercase alphanumeric and hyphens, no leading/trailing hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'XAF', enum: ['XAF', 'XOF', 'EUR', 'USD', 'GBP'] })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'CM' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'fr', enum: ['fr', 'en'] })
  @IsOptional()
  @IsString()
  language?: string;
}
