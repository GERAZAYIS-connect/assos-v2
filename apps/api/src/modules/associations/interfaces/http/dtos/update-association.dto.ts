import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class UpdateAssociationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motto?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  savingsInterestRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  joiningFee?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  legalStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  registrationRef?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  plan?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  alertThresholds?: any;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  branding?: any;
}
