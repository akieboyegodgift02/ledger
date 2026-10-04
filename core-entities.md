# CORE ENTITIES

User
Account
Wallet
Transaction
Ledger Entry
Fraud Assessment


User
 │
 └── Account
       │
       └── Wallet
             │
             └── Ledger Entries
                    ▲
                    │
               Transaction
                    │
                    ▼
             Fraud Assessment

# 1. USER

User
├── id
├── email
├── name
├── status
└── created_at


# 2. ACCOUNT

User
 │
 └── Personal Account

accounts
├── id
│   └── INTEGER PRIMARY KEY
│
├── user_id
│   ├── UUID
│   ├── NOT NULL
│   ├── FOREIGN KEY → users.id
│   └── UNIQUE
│
├── status
│   ├── ACTIVE
│   └── INACTIVE
│
└── created_at
    └── TIMESTAMPTZ DEFAULT NOW()

# 3. WALLET

Wallet
├── id
├── account_id
├── currency
├── status
└── created_at

# TRANSACTION

Transaction Type
├── TRANSFER
├── DEPOSIT
├── WITHDRAWAL
└── REFUND

TRANSACTION LIFECYCLE

PENDING
   │
   ├──→ COMPLETED
   │
   ├──→ FAILED
   │
   └──→ BLOCKED

# LEDGER ENTRIES
Alice → Bob
₦10,000

Transaction #123
│
├── Ledger Entry
│     Alice
│     -₦10,000
│
└── Ledger Entry
      Bob
      +₦10,000

# WHAT ABOUT BALANCE
Not that balance cannot be stored, A production system mantains a materialized/current balance for fast reads, and that's what this system is emulating

# FRAUD ASSESSMENT

Transaction
      │
      ▼
Fraud Assessment
├── risk_score
├── decision
├── reasons
└── created_at

# WORK FLOW

                    Transfer Request
                           │
                           ▼
                    Validate request
                           │
                           ▼
                    Fraud Assessment
                           │
                ┌──────────┴──────────┐
                │                     │
              BLOCK                 APPROVE
                │                     │
                ▼                     ▼
             Reject             Begin DB transaction
                                      │
                                      ▼
                              Create transaction
                                      │
                                      ▼
                              Create ledger entries
                                      │
                                      ▼
                              Commit transaction
                                      │
                                      ▼
                                  Success