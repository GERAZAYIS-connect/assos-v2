import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../domain/ports/password-hasher.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
