import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import {AuthGuard} from "./auth.guard";

@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET_KEY,
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [
        AuthService,
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
