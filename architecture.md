### Ledger - Payment Wallet Infrastructure.

A Production Style Financial Infrastructure Platform for wallet management, payment processing, double-entry accounting, transaction reconciliation, and real-time fraud detection

Core Capabilities:

1. Identify
 Users
 Authentication
 Authourization

2. Financial Core
 Wallets
 Accounts
 Ledger
 Transfer
 Payments
 Refunds

3. Payment Infrastructure
 Providers
 Webhooks
 Idempotency
 Reconciliation

4. Risk Engine
 Real-time rules
 Risk scoring
 Behavioural analysis
 Fraud decisions

5. Infrastructure
 Redis
 Queues
 Workers
 Observability


## ARCHITECTURE PHILOSOPHY:
Modular Monolith Framework

# REQUEST FLOW:

Suppose Alice wants to transfer money to Bob.

Alice
 │
 │ POST /transfers
 ▼
API
 │
 ▼
Authentication
 │
 ▼
Transfer Module
 │
 ├──────► Risk Engine
 │             │
 │             ▼
 │          ALLOW
 │
 ▼
Database Transaction
 │
 ├── Debit Alice
 ├── Credit Bob
 └── Record ledger entries
 │
 ▼
Outbox Event
 │
 ▼
Queue
 │
 ├── Notification
 ├── Analytics
 └── Other async work


Architectural Decision:
Asynchronous: Because financial data in sensitive and data flow might need more asynchronous processes to produce a reliable and robust system

# DEVELOPMENT ENVIRONMENT

Language - TypeScript
Runtime Environment - NodeJS
HTTP - Fastify
Database - PostgreSQL
ORM - Drizzle
Cache/State - Redis
Containers - Kubernates
Testing - Vitest
API docs - OpenAI
Load testing - k6 
Fraud Intelligence - Python

# SYSTEM ARCHITECTURE 

                         CLIENT
                           │
                           ▼
                    ┌─────────────┐
                    │   Fastify   │
                    │     API     │
                    └──────┬──────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
        Payments        Wallets        Fraud
         Module          Module         Module
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                     Ledger Module
                           │
                           ▼
                      PostgreSQL
                           │
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 Ledger       Outbox
                 Tables       Events
                                  │
                                  ▼
                              Queue
                                  │
                     ┌────────────┼───────────┐
                     ▼            ▼           ▼
                 Fraud         Email      Analytics
                 Worker        Worker       Worker

