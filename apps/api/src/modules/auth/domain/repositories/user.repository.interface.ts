import { UserEntity } from '../entities/user.entity';

/**
 * IUserRepository — Domain Port
 * The infrastructure layer must implement this interface.
 * The domain never knows about Prisma or any specific DB.
 */
export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  create(data: {
    email?: string;
    phone?: string;
    passwordHash: string;
  }): Promise<UserEntity>;
  emailExists(email: string): Promise<boolean>;
  phoneExists(phone: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
