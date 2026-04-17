import {Controller, Post, HttpCode, HttpStatus, Req, Body, UseInterceptors} from '@nestjs/common';
import { AuthService } from './auth.service';
import {LoginDto} from "./dto/sign-in.dto";
import type { Request } from 'express';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant/client';
import {TenantInterceptor} from "../interceptors/tenant.interceptor";
import {ApiHeader, ApiTags} from "@nestjs/swagger";

interface TenantRequest extends Request {
    tenantPrisma: TenantPrismaClient;
}

@Controller('api/v1/auth')
@ApiTags('Auth')
@ApiHeader({
    name: 'X-Tenant-ID',
})
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Req() request: TenantRequest, @Body() loginDto: LoginDto) {
        return this.authService.signIn(request.tenantPrisma, loginDto.email, loginDto.password);
    }
}
