import {Controller, Post, HttpCode, HttpStatus, Req, Body, UseGuards, Get, Param} from '@nestjs/common';
import type { Request } from 'express';
import {ApiBearerAuth, ApiHeader, ApiTags} from "@nestjs/swagger";
import {TenantContextService} from "../services/tenant-context.service";
import {CampaignService} from "./campaign.service";
import {CampaignDto} from "./dto/campaign.dto";
import {AuthGuard} from "../auth/auth.guard";
import {Roles} from "../roles/roles.decorator";
import {Role} from "../roles/role.enum";
import {RolesGuard} from "../roles/roles.guard";

@Controller()
@ApiTags('Campaign')
@ApiHeader({
    name: 'x-tenant-id',
})
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class CampaignController {
    constructor(
        private readonly campaignService: CampaignService,
        private readonly tenantContext: TenantContextService
    ) {}

    @HttpCode(HttpStatus.CREATED)
    @Post('create-campaign')
    @Roles(Role.TenantAdmin)
    async createCampaign(@Req() request: Request, @Body() campaignDto: CampaignDto) {
        const prisma = await this.tenantContext.getTenantPrisma(request)
        const campaign = await this.campaignService.create(prisma, campaignDto.name)

        return {
            data: campaign
        };
    }

    @Get('list-campaign')
    @Roles(Role.TenantAdmin, Role.TenantUser)
    async listCampaigns(@Req() request: Request) {
        const prisma = await this.tenantContext.getTenantPrisma(request)
        const campaigns = await this.campaignService.findAll(prisma)

        return {
            data: campaigns
        };
    }

    @Get('get-campaign/:id')
    @Roles(Role.TenantAdmin, Role.TenantUser)
    async getCampaign(@Req() request: Request, @Param('id') id: string) {
        const prisma = await this.tenantContext.getTenantPrisma(request)
        const campaign = await this.campaignService.findOne(prisma, id)

        return {
            data: campaign
        };
    }
}
