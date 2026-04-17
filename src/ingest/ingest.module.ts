import {Module} from "@nestjs/common";
import {IngestService} from "./ingest.service";
import {IngestController} from "./ingest.controller";
import {SqsService} from "../sqs.service";

@Module({
    providers: [IngestService, SqsService],
    controllers: [IngestController],
})
export class IngestModule {}