## Backend Dev Takehome Assignment - 2026-Feb

# Multi-Tenant Website Tracking Backend

## Objective

Build a **multi-tenant website user tracking backend** using:

- **NestJS (preferred)** or Express
- **PostgreSQL**
- **SQS (preferred; LocalStack acceptable)**
- **Docker**
  This exercise evaluates your ability to design and implement:
- Multi-tenant logic and data isolation
- JWT authentication
- RBAC (tenant-admin, tenant-user)
- Ingestion + service APIs
- Queue-based processing (SQS)
- Idempotent event handling
- Basic aggregation logic
- Dockerised infrastructure
- Clean project structure and documentation

## Functional Requirements

## 1. Multi-Tenant Ingestion

Expose a **single ingestion endpoint** that allows tenant websites to send tracking events.
All tenants use the same endpoint.

#### Tenant Identification

Tenants are identified **only by tenant_id**.
Your system must:

- Accept a tenant_id with each ingestion request.
- Correctly associate all incoming events with the appropriate tenant.
- Ensure strict tenant isolation at the database and service layers.
  Each tenant website may send events for multiple campaign IDs under the same tenant ID.


#### Event Payload

The structure of the payload will look like this:
{
tenant_id: string;
ip_address: string;
user_agent: string;
timestamp: UTCdatetime;
event_id?: string;
}
Please note:

- Multiple events may belong to the same campaign.
- You must design for idempotency (duplicate submissions must not corrupt aggregates).
  If you make any adjustments, document your event schema and reasoning in the README.

### 2. Queue-Based Processing

The ingestion endpoint must:

1. Validate request structure.
2. Validate that the tenant_id exists.
3. Enqueue the event to **SQS**.
   A worker/consumer must:
1. Read messages from SQS.
2. Persist events to PostgreSQL.
3. Perform aggregation logic.
   You may use:
- Real AWS SQS, or
- LocalStack (acceptable)
  You must document how to run SQS locally if using LocalStack.

### 3. Data Integrity Requirements

Your system must:

- Tolerate **at-least-once delivery semantics** (SQS default).
- Prevent duplicate events from corrupting counts.
- Avoid dropped events during normal retry scenarios.
  Assume:
- SQS may deliver messages more than once.


- Consumers may crash and restart.
  Design for safe retries and idempotent processing.

### 4. Aggregation

Implement **daily aggregation per campaign** :
Count of events per campaign per day.
You may:

- Compute aggregates on write, or
- Compute via SQL queries, or
- Maintain a materialized aggregation table
  Document your choice and reasoning.

### 5. Authentication & RBAC

Implement JWT-based authentication for users.
Each tenant must support two role types:

- tenant-admin
- tenant-user
  Roles are tenant-scoped.
  A user from Tenant A must never access Tenant B data.

### 6. Campaign API

Expose the following endpoints and document them with Swagger:

#### POST /create-campaign

- Role: tenant-admin

#### GET /list-campaign

- Roles: tenant-admin, tenant-user

#### GET /get-campaign/:id

- Roles: tenant-admin, tenant-user
  All endpoints must be:
- JWT protected


- Tenant scoped
- Properly documented in Swagger (including auth)
  Unauthorized requests must return appropriate HTTP status codes.

## Non-Functional Requirements

### 1. Docker

The project must be dockerised.
At minimum:

- API service
- PostgreSQL
- SQS (if using LocalStack)
  A single docker compose up (or similar) should be sufficient to run the system locally.

### 2. Database

- Use PostgreSQL.
- Use migrations.
- Use constraints where appropriate (especially for idempotency).

#### Seeding (Optional but Recommended)

You may include database seeding for:

- Tenants
- Users
- Campaigns
- Events
  If provided, document seeded credentials in the README.

### 3. README

Your repository must include a clear README covering:

- Architecture overview
- Multi-tenant strategy
- Idempotency strategy
- Aggregation strategy
- How to run locally
- How to configure environment variables
- How to authenticate
- Swagger URL
- Example requests for:


- Ingestion
- Auth
- Campaign endpoints

## What to Submit

- A **GitHub repository link**
- Clear setup instructions
- No need for production deployment unless you choose to include it

## Evaluation Criteria

You will be assessed based on the below table:
**Category Weight**
Multi-Tenant Isolation 20
JWT + RBAC 15
SQS Usage & Consumer Design 15
Idempotent Event Handling 15
Data Modeling Quality 10
Aggregation Correctness 10
Code Organization & Clarity 5
Swagger Completeness 5
Docker Setup Quality 5
Documentation Quality 5

## Constraints & Expectations

- Keep the solution reasonably scoped.
- Production-level polish is not required.
- Prioritize correctness, clarity, and clean architecture over over-engineering.
- The assignment is expected to take approximately **6–8 hours**.
  If anything is unclear, document your assumptions in the README.


