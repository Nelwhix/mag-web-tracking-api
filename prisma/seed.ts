import 'dotenv/config'
import {Client, Pool} from 'pg';
import {PrismaPg} from "@prisma/adapter-pg";
import { PrismaClient as GlobalPrismaClient } from '../src/generated/prisma/client';
import { PrismaClient as TenantPrismaClient } from '../src/generated/tenant/client';
import {execSync} from "node:child_process";
import * as bcrypt from 'bcrypt';

async function main() {
    const tenants = [
        {
            id: '01KPBHFE01ARJGFTMAWT7S31Z8',
            name: 'Tenant A',
            dbName: 'tenant_a'
        },
        {
            id: '01KPBHFTAEFFNGMVWMN6AA9AWZ',
            name: 'Tenant B',
            dbName: 'tenant_b'
        }
    ];

    const adminUrl = new URL(process.env.GLOBAL_DATABASE_URL!);
    const adminClient = new Client({
        host: adminUrl.hostname,
        port: parseInt(adminUrl.port),
        user: adminUrl.username,
        password: adminUrl.password,
        database: 'postgres'
    });

    await adminClient.connect();

    const globalPool = new Pool({ connectionString: adminUrl.toString() });
    const globalAdapter = new PrismaPg(globalPool);
    const globalPrisma = new GlobalPrismaClient({ adapter: globalAdapter });

    try {
        for (const tenant of tenants) {
            console.log(`Processing ${tenant.name}...`);

            const dbCheck = await adminClient.query(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                [tenant.dbName]
            );

            if (dbCheck.rowCount === 0) {
                console.log(`Creating database ${tenant.dbName}...`);
                await adminClient.query(`CREATE DATABASE ${tenant.dbName}`);
            } else {
                console.log(`Database ${tenant.dbName} already exists.`);
            }

            const tenantDbUrl = `postgresql://${adminUrl.username}:${adminUrl.password}@${adminUrl.hostname}:${adminUrl.port}/${tenant.dbName}`;
            await globalPrisma.tenant.upsert({
                where: { id: tenant.id },
                update: {
                    name: tenant.name,
                    database_url: tenantDbUrl,
                },
                create: {
                    id: tenant.id,
                    name: tenant.name,
                    database_url: tenantDbUrl,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            console.log(`Tenant ${tenant.name} registered successfully.`);
            console.log(`-----------------------------------------------`);
            console.log(`Migrating Tenant: ${tenant.name} (${tenant.id})`);

            try {
                execSync(
                    `DATABASE_URL="${tenantDbUrl}" npx prisma migrate deploy --config=prisma.tenant.config.ts --schema=prisma/tenant.prisma`,
                    { stdio: 'inherit' }
                );
                console.log(`Successfully migrated ${tenant.name}`);
            } catch (err) {
                console.error(`Failed to migrate ${tenant.name}:`, err.message);
                continue
            }

            const tenantPool = new Pool({ connectionString: tenantDbUrl });
            const tenantAdapter = new PrismaPg(tenantPool);
            const tenantPrisma = new TenantPrismaClient({ adapter: tenantAdapter });
            const saltOrRounds = 12;
            const password = await bcrypt.hash('password123', saltOrRounds);

            try {
                console.log(`Seeding users for ${tenant.name}...`);

                const users = [
                    {
                        email: `admin@${tenant.dbName}.com`,
                        password: password, // Use a hasher like bcrypt in production
                        role: 'tenant-admin',
                    },
                    {
                        email: `user@${tenant.dbName}.com`,
                        password: password,
                        role: 'tenant-user',
                    }
                ];

                for (const user of users) {
                    await tenantPrisma.user.upsert({
                        where: { email: user.email },
                        update: {},
                        create: {
                            ...user,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }
                console.log(`Users seeded for ${tenant.name}`);

            } finally {
                await tenantPrisma.$disconnect();
                await tenantPool.end();
            }
        }
    } catch (error) {
        console.error('Error during seeding:', error)
    } finally {
        await adminClient.end();
        await globalPrisma.$disconnect();
        await globalPool.end();
    }
}

main();


