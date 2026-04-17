import { Injectable } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant/client';

@Injectable()
export class UsersService {
    async findOne(prisma: TenantPrismaClient, email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
}
