import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersRepository extends BaseRepository<User, any, any> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
