import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    NotFoundException
} from "@nestjs/common";
import {TenantPrismaService} from "../services/tenant-prisma.service";
import {GlobalPrismaService} from "../services/global-prisma.service";
import {Observable} from "rxjs";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(
        private readonly globalPrisma: GlobalPrismaService,
        private readonly tenantPrismaService: TenantPrismaService
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.headers['x-tenant-id'];

        if (! tenantId) {
            throw new BadRequestException('Tenant ID is required');
        }

        const tenant = await this.globalPrisma.tenant.findUnique({ where: { id: tenantId } });
        if (! tenant) throw new NotFoundException('Tenant not found');

        request.tenantPrisma = await this.tenantPrismaService.getClient(tenant.database_url);

        return next.handle();
    }
}