import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxx' })
  userId: string;

  @ApiProperty({ description: 'JWT access token (15 min expiry)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (30 days expiry)' })
  refreshToken: string;
}
