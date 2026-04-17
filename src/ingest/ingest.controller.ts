import {Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {IngestDto} from "./dto/ingest.dto";
import {IngestService} from "./ingest.service";

@Controller()
@ApiTags('Ingest')
export class IngestController {
    constructor(
        private readonly ingestService: IngestService
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('ingest')
    async ingest(@Body() ingestDto: IngestDto) {
        await this.ingestService.ingest(ingestDto)

        return {
            message: 'ok'
        };
    }
}
