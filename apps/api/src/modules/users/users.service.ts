import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async findOne(tenantId: string, id: string): Promise<User> {
    const user = await this.repository.findOne(tenantId, { id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.repository.findAll(tenantId);
  }

  async create(tenantId: string, dto: any): Promise<User> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email address already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    return this.repository.create(tenantId, {
      ...dto,
      password: hashedPassword,
    });
  }

  async delete(tenantId: string, id: string): Promise<User> {
    await this.findOne(tenantId, id);
    return this.repository.delete(tenantId, id);
  }
}
