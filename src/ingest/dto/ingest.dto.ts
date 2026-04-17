import {IsISO8601, IsNotEmpty, IsString, Matches} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class IngestDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    tenant_id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    ip_address: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    user_agent: string;

    @IsISO8601()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The timestamp of the event in ISO 8601 format (UTC)',
        example: '2026-04-17T13:23:00Z'
    })
    timestamp: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    campaign_id: string

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'A unique identifier for the event (ULID format)',
        example: '01ARZ3NDEKTSV4RRFFQ6KHNQEY'
    })
    @Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/i, {
        message: 'event_id must be a valid ULID',
    })
    event_id: string;
}