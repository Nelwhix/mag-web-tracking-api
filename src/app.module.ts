import { Module } from '@nestjs/common';
import {AuthModule} from "./auth/auth.module";
import {PrismaModule} from "./prisma/prisma.module";
import {CampaignModule} from "./campaign/campaign.module";
import {IngestModule} from "./ingest/ingest.module";
import {WorkerModule} from "./worker/worker.module";

@Module({
  imports: [AuthModule, PrismaModule, CampaignModule, IngestModule, WorkerModule]
})
export class AppModule {}
