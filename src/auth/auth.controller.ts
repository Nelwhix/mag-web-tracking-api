import {Controller, Post, HttpCode, HttpStatus, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {LoginDto} from "./dto/sign-in.dto";
import type { Request } from 'express';
import {ApiHeader, ApiTags} from "@nestjs/swagger";
import {TenantContextService} from "../services/tenant-context.service";

@Controller()
@ApiTags('Auth')
@ApiHeader({
    name: 'x-tenant-id',
})
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tenantContext: TenantContextService
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Req() request: Request, @Body() loginDto: LoginDto) {
        const prisma = await this.tenantContext.getTenantPrisma(request)
        const userData = await this.authService.signIn(prisma, loginDto.email, loginDto.password)

        return {
            data: userData
        };
    }
}
