import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class GlobalPrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma: PrismaClient

    constructor() {
        const connectionString = `${process.env.GLOBAL_DATABASE_URL}`;
        const adapter = new PrismaPg({ connectionString });
        this.prisma = new PrismaClient({ adapter })
    }

    get tenant() {
        return this.prisma.tenant
    }

    async onModuleInit(): Promise<void> {
        await this.prisma.$connect();
    }

    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }
}