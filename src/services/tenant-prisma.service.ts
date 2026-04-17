import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant/client';
import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";

@Injectable()
export class TenantPrismaService {
    private static clients: Map<string, TenantPrismaClient> = new Map();

    async getClient(dbUrl: string): Promise<TenantPrismaClient> {
        const cachedClient = TenantPrismaService.clients.get(dbUrl);
        if (cachedClient) {
            return cachedClient;
        }

        const pool = new Pool({ connectionString: dbUrl });
        const adapter = new PrismaPg(pool);
        const client = new TenantPrismaClient({
            adapter: adapter,
        });

        await client.$connect();

        TenantPrismaService.clients.set(dbUrl, client);
        return client;
    }
}