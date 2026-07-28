import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(4000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  jwtPrivateKey: z.string().optional(),
  jwtPublicKey: z.string().optional(),
  jwtAccessExpiry: z.string().default('15m'),
  jwtRefreshExpiry: z.string().default('30d'),
  platformDomain: z.string().default('lvh.me'),
  reservedSlugs: z.array(z.string()).default([
    'api', 'admin', 'app', 'support', 'www', 'static', 'assets', 'auth', 'webhook', 'help', 'blog', 'pricing'
  ]),
});

export type AppConfig = z.infer<typeof configSchema>;

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
  jwtPublicKey: process.env.JWT_PUBLIC_KEY,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  platformDomain: process.env.PLATFORM_DOMAIN || 'asso-in.online',
  reservedSlugs: (process.env.RESERVED_SLUGS || 'api,admin,app,support,www,static,assets,auth,webhook,help,blog,pricing').split(','),
}));

export function validateConfig(config: Record<string, unknown>) {
  return config;
}
