import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import * as path from 'path';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
    let url = rawUrl;
    let authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

    const isRemote =
      rawUrl.startsWith('libsql://') ||
      rawUrl.startsWith('wss://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('http://');

    if (!isRemote) {
      const dbPath = rawUrl.replace(/^file:/, '');
      const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
      url = `file:${absolutePath.replace(/\\/g, '/')}`;
    }

    const libsql = createClient({ url, authToken });
    const adapter = new PrismaLibSql({ url, client: libsql } as any);

    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    this.logger.log(`Initializing Prisma Client with URL: ${isRemote ? 'Remote LibSQL Database' : url}`);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established (SQLite)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
