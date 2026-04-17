import { Module } from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {TenantInterceptor} from "./interceptors/tenant.interceptor";
import {TenantPrismaService} from "./services/tenant-prisma.service";
import {GlobalPrismaService} from "./services/global-prisma.service";
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [
    GlobalPrismaService,
    TenantPrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
