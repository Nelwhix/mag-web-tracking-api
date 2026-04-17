import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import {SqsWorkerService} from "./sqs-worker.service";

@Module({
    imports: [
        SqsModule.register({
            consumers: [
                {
                    name: 'INGEST_QUEUE',
                    queueUrl: process.env.SQS_QUEUE_URL!,
                    region: process.env.AWS_REGION,
                },
            ]
        }),
    ],
    providers: [SqsWorkerService]
})
export class WorkerModule {}