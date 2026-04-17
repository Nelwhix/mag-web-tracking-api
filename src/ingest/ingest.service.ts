import {Injectable, NotFoundException} from "@nestjs/common";
import {SqsService} from "../sqs.service";
import {IngestDto} from "./dto/ingest.dto";
import {GlobalPrismaService} from "../services/global-prisma.service";

@Injectable()
export class IngestService {
    constructor(
        private readonly globalPrisma: GlobalPrismaService,
        private sqsService: SqsService
    ) {
    }

    async ingest(payload: IngestDto) {
        const tenant = await this.globalPrisma.tenant.findUnique({
            where: { id: payload.tenant_id }
        });

        if (! tenant) {
            throw new NotFoundException('Tenant not found');
        }

        await this.sqsService.sendMessage(payload);
    }
}