import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { GlobalPrismaService } from './global-prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';

@Injectable()
export class TenantContextService {
    constructor(
        private readonly globalPrisma: GlobalPrismaService,
        private readonly tenantPrismaService: TenantPrismaService,
    ) {}

    async getTenantPrisma(request: Request) {
        const tenantID = request.headers['x-tenant-id'] as string | undefined
        if (! tenantID) {
            throw new BadRequestException('Tenant ID header is required.')
        }
        const tenant = await this.globalPrisma.tenant.findUnique({
            where: { id: tenantID }
        });

        if (! tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return this.tenantPrismaService.getClient(tenant.database_url);
    }
}
