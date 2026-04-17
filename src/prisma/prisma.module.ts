import { Global, Module } from '@nestjs/common';
import { GlobalPrismaService } from '../services/global-prisma.service';
import { TenantPrismaService } from '../services/tenant-prisma.service';
import {TenantContextService} from "../services/tenant-context.service";

@Global()
@Module({
    providers: [GlobalPrismaService, TenantPrismaService, TenantContextService],
    exports: [GlobalPrismaService, TenantPrismaService, TenantContextService],
})
export class PrismaModule {}