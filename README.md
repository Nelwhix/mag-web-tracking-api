# Multi-Tenant Website Tracking Backend

## Architecture Overview

The system consists of:
- **API Service**: Handles event ingestion and provides management APIs (Campaigns).
- **Worker Service**: A background consumer that processes events from SQS.
- **SQS (AWS)**: Acts as a buffer between ingestion and persistence, ensuring high availability and retry capabilities.
- **PostgreSQL**: Stores tenant data with strict isolation.
- **Global Database**: Manages tenant registration and database connection strings.
- **Tenant Databases**: Each tenant has their own dedicated database for full data isolation.

## Multi-Tenant Strategy

We use a **Database-per-Tenant** strategy to ensure maximum isolation and security.
- **Tenant Identification**: Tenants are identified by a unique `tenant_id`.
- **Global Registry**: A global database maps `tenant_id` to its specific `database_url`.
- **Dynamic Context**: For management APIs, the `x-tenant-id` header is used to switch the database context dynamically.
- **Isolation**: Each tenant's data (Users, Campaigns, Events, Stats) resides in its own database, preventing any cross-tenant data leakage.

## Idempotency Strategy

To handle SQS "at-least-once" delivery semantics and prevent duplicate data:
1. **Unique Event ID**:  Each ingestion request should include a unique `event_id`.
2. **Existence Check**: Before processing, the worker checks if the `event_id` already exists in the tenant's database.
3. **Atomic Transactions**: Event creation and stats aggregation are wrapped in a single database transaction. If any part fails (e.g., duplicate `event_id` due to a race condition), the entire operation rolls back.

## Aggregation Strategy

We implement **Daily Aggregation per Campaign** to provide fast access to tracking metrics.
- **Atomic Upserts**: We use Prisma's `upsert` with atomic `increment` operations.
- **Normalization**: Timestamps are normalized to the start of the day (UTC) to group events correctly.
- **Performance**: By computing aggregates on write (within the worker), we ensure that `GET /get-campaign/:id` remains fast even as event volume grows.

## Event Schema

To ensure high performance, reliable idempotency, and clear multi-tenant isolation, we use the following event payload schema:

| Field | Type | Description | Required |
|---|---|---|---|
| `tenant_id` | `string` | Unique identifier for the tenant. | Yes |
| `campaign_id` | `string` | Unique identifier for the specific campaign. | Yes |
| `event_id` | `string` | A unique identifier for the event (ULID format recommended). | Yes |
| `ip_address` | `string` | The IP address of the user who triggered the event. | Yes |
| `user_agent` | `string` | The user agent of the browser that triggered the event. | Yes |
| `timestamp` | `string` | ISO 8601 UTC timestamp of the event. | Yes |

### Schema Adjustments & Reasoning

The following adjustments were made to the initial payload requirements to ensure system robustness:

1.  **Required `campaign_id`**: Although not explicitly required in the initial prompt, it is essential for the **Daily Aggregation per Campaign** requirement. Without a `campaign_id` in the payload, we cannot correctly attribute and aggregate events for tracking metrics.
2.  **Required `event_id`**: This field was made mandatory to implement the **Idempotency Strategy**. A unique `event_id` allows the worker to perform a "check-and-set" operation, ensuring that SQS "at-least-once" delivery does not lead to duplicate data or corrupted aggregates.
3.  **ULID Format for `event_id`**: We use Universally Unique Lexicographically Sortable Identifiers (ULID) for `event_id`. ULIDs provide both uniqueness (like UUIDs) and lexicographical sorting, which improves database indexing performance and makes events easier to trace chronologically.

## Getting Started

### Prerequisites
- Docker and Docker Compose

### How to Run Locally

1. **Clone the repository**
2. **Configure environment variables**
   Create a .env and attach the contents I sent via email
3. **Start the infrastructure**
   ```bash
   docker compose up -d
   ```
4. **Seed the database**
   The seed script creates two tenants (Tenant A, Tenant B) and their respective admin/user accounts.
   ```bash
   docker compose run --rm app npx prisma migrate deploy # For global DB
   docker compose run --rm app npx prisma db seed
   ```

## Authentication & RBAC

The system supports two roles per tenant:
- **`tenant-admin`**: Can create campaigns and view statistics.
- **`tenant-user`**: Can view campaign statistics.

Authentication is handled via JWT. Every request to protected endpoints must include:
- `Authorization: Bearer <JWT_TOKEN>`
- `x-tenant-id: <TENANT_ID>`

## API Documentation

Swagger UI is available at: `http://localhost:3000/api`

### Example Requests

#### 1. Auth (Login)
**POST** `/login`  
**Headers**: `x-tenant-id: 01KPBHFE01ARJGFTMAWT7S31Z8`
```json
{
  "email": "admin@tenant_a.com",
  "password": "password123"
}
```
*Note: Use the `data.access_token` from the response for subsequent protected requests.*

#### 2. Create Campaign (Protected)
Since campaigns are not seeded by default, you must create one first.  
**POST** `/create-campaign`  
**Headers**: 
- `Authorization: Bearer <JWT_TOKEN>`
- `x-tenant-id: 01KPBHFE01ARJGFTMAWT7S31Z8`
```json
{
  "name": "Spring Sale 2026"
}
```
*Note: Save the `data.id` (campaign_id) to use in the ingestion request.*

#### 3. Ingestion (Public)
Pass a unique event_id each time, duplicate event_ids are dropped. They are of ULID format, you can generate one here: https://ulidgenerator.com/
**POST** `/ingest`
```json
{
  "tenant_id": "01KPBHFE01ARJGFTMAWT7S31Z8",
  "campaign_id": "01KPBHFE01ARJGFTMAWT7S31Z9",
  "event_id": "01ARZ3NDEKTSV4RRFFQ6KHNQEY",
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2026-04-17T15:19:00Z"
}
```

#### 4. List Campaigns (Protected)
**GET** `/list-campaign`  
**Headers**: 
- `Authorization: Bearer <JWT_TOKEN>`
- `x-tenant-id: 01KPBHFE01ARJGFTMAWT7S31Z8`

## Seeded Credentials

| Tenant | User | Email | Password |
|--------|------|-------|----------|
| Tenant A | Admin | `admin@tenant_a.com` | `password123` |
| Tenant A | User | `user@tenant_a.com` | `password123` |
| Tenant B | Admin | `admin@tenant_b.com` | `password123` |
| Tenant B | User | `user@tenant_b.com` | `password123` |
