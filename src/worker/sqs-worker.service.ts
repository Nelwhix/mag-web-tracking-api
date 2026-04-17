import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import {GlobalPrismaService} from "../services/global-prisma.service";
import {IngestDto} from "../ingest/dto/ingest.dto";
import {TenantPrismaService} from "../services/tenant-prisma.service";

@Injectable()
export class SqsWorkerService {
    private readonly logger = new Logger(SqsWorkerService.name);

    constructor(
        private readonly globalPrisma: GlobalPrismaService,
        private readonly tenantPrismaService: TenantPrismaService,
    ) {
    }

    @SqsMessageHandler('INGEST_QUEUE', false)
    public async handleMessage(message: Message) {
        const body = JSON.parse(message.Body!) as IngestDto;
        this.logger.log(`Processing message: ${body.event_id}`);

        const tenant = await this.globalPrisma.tenant.findUnique({
            where: { id: body.tenant_id }
        });
        if (! tenant) {
            return
        }

        const tenantPrismaClient = await this.tenantPrismaService.getClient(tenant.database_url)
        const existingEvent = await tenantPrismaClient.event.findUnique({
            where: { id: body.event_id }
        });
        if (existingEvent) {
            return;
        }

        const eventDate = new Date(body.timestamp);
        eventDate.setUTCHours(0, 0, 0, 0);

        try {
            await tenantPrismaClient.$transaction(async (tx) => {
                await tx.event.create({
                    data: {
                        id: body.event_id,
                        campaign_id: body.campaign_id,
                        payload: {
                            ip_address: body.ip_address,
                            user_agent: body.user_agent,
                        },
                        created_at: new Date(body.timestamp),
                        updated_at: new Date(body.timestamp)
                    }
                });

                await tx.campaignDailyStats.upsert({
                    where: {
                        campaign_id_date: {
                            campaign_id: body.campaign_id,
                            date: eventDate,
                        }
                    },
                    update: {
                        event_count: { increment: 1 },
                        updated_at: new Date()
                    },
                    create: {
                        campaign_id: body.campaign_id,
                        date: eventDate,
                        event_count: 1,
                    }
                });
            });

            this.logger.log(`Successfully processed event ${body.event_id} and updated stats.`);
        } catch (error) {
            this.logger.error(`Failed to process message ${body.event_id}: ${error.message}`);
            throw error;
        }
    }

    @SqsConsumerEventHandler('INGEST_QUEUE', 'error')
    public onProcessingError(error: Error, message: Message) {
        this.logger.error(`Error processing message: ${error.message}`);
    }
}