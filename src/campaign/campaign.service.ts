import { Injectable } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant/client';

@Injectable()
export class CampaignService {
    async create(prisma: TenantPrismaClient, name: string) {
        return prisma.campaign.create({
            data: { name },
        });
    }

    async findAll(prisma: TenantPrismaClient) {
        return prisma.campaign.findMany({
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });
    }

    async findOne(prisma: TenantPrismaClient, id: string) {
        return prisma.campaign.findUnique({
            where: { id },
            include: {
                stats: true
            }
        });
    }
}