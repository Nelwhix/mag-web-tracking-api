import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant/client';
import * as bcrypt from 'bcrypt';
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async signIn(prisma: TenantPrismaClient, email: string, password: string) {
        const user = await this.usersService.findOne(prisma, email);
        if (! user) {
            throw new UnauthorizedException();
        }
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (! passwordMatches) {
            throw new UnauthorizedException();
        }

        const payload = {
            sub: user.id,
            email: user.email
        };

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            token: await this.jwtService.signAsync(payload),
        };
    }
}
