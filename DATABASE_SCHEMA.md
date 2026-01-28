# PhotoBlock Database Schema (ERD)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PHOTOBLOCK ERD                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│       USERS          │       │       PROFILES       │       │       PHOTOS         │
├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
│ id (PK, UUID)        │───1:1─│ id (PK, UUID)        │       │ id (PK, UUID)        │
│ email                │       │ user_id (FK) ────────│───────│ user_id (FK) ────────│
│ encrypted_password   │       │ username             │       │ cid (IPFS hash)      │
│ email_confirmed_at   │       │ full_name            │       │ filename             │
│ created_at           │       │ wallet_address       │       │ file_size            │
│ updated_at           │       │ avatar_url           │       │ mime_type            │
│ last_sign_in_at      │       │ bio                  │       │ tx_hash              │
└──────────────────────┘       │ created_at           │       │ chain_id             │
         │                     │ updated_at           │       │ contract_address     │
         │                     └──────────────────────┘       │ block_number         │
         │                              │                     │ status               │
         │                              │                     │ metadata (JSONB)     │
         │                              │                     │ created_at           │
         │                              │                     │ updated_at           │
         │                              │                     └──────────────────────┘
         │                              │                              │
         │                              │                              │
         ▼                              ▼                              ▼
┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│     AUDIT_LOGS       │       │      SESSIONS        │       │   PHOTO_SHARES       │
├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
│ id (PK, UUID)        │       │ id (PK, UUID)        │       │ id (PK, UUID)        │
│ user_id (FK)         │       │ user_id (FK)         │       │ photo_id (FK)        │
│ action               │       │ device_info          │       │ shared_by (FK)       │
│ resource_type        │       │ ip_address           │       │ shared_with (FK)     │
│ resource_id          │       │ user_agent           │       │ access_level         │
│ old_data (JSONB)     │       │ created_at           │       │ expires_at           │
│ new_data (JSONB)     │       │ last_active_at       │       │ created_at           │
│ ip_address           │       │ expires_at           │       └──────────────────────┘
│ user_agent           │       └──────────────────────┘
│ metadata (JSONB)     │
│ created_at           │
└──────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│   VERIFICATIONS      │       │    WALLETS           │
├──────────────────────┤       ├──────────────────────┤
│ id (PK, UUID)        │       │ id (PK, UUID)        │
│ photo_id (FK)        │       │ user_id (FK)         │
│ verified_by (FK)     │       │ address              │
│ verification_type    │       │ chain_id             │
│ status               │       │ is_primary           │
│ signature            │       │ verified_at          │
│ metadata (JSONB)     │       │ created_at           │
│ created_at           │       └──────────────────────┘
└──────────────────────┘
```

## Tables Description

### 1. USERS (Managed by Supabase Auth)
Supabase handles this automatically via `auth.users`.

### 2. PROFILES
Extended user information linked to auth.users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| username | VARCHAR(50) | Unique username |
| full_name | VARCHAR(255) | User's full name |
| wallet_address | VARCHAR(42) | Primary Ethereum wallet |
| avatar_url | TEXT | Profile picture URL |
| bio | TEXT | User bio |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### 3. PHOTOS
Records of photos uploaded and stored on IPFS/blockchain.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner's user ID |
| cid | VARCHAR(100) | IPFS Content ID |
| filename | VARCHAR(255) | Original filename |
| file_size | BIGINT | File size in bytes |
| mime_type | VARCHAR(100) | MIME type |
| tx_hash | VARCHAR(66) | Blockchain transaction hash |
| chain_id | INTEGER | Blockchain network ID |
| contract_address | VARCHAR(42) | Smart contract address |
| block_number | BIGINT | Block number when confirmed |
| status | VARCHAR(20) | pending/confirmed/failed |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMPTZ | Upload time |
| updated_at | TIMESTAMPTZ | Last update |

### 4. AUDIT_LOGS
Tracks all user actions for security and compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who performed action |
| action | VARCHAR(50) | Action type (login, upload, etc.) |
| resource_type | VARCHAR(50) | Type of resource affected |
| resource_id | UUID | ID of affected resource |
| old_data | JSONB | Previous state (for updates) |
| new_data | JSONB | New state |
| ip_address | INET | Client IP address |
| user_agent | TEXT | Browser/client info |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMPTZ | When action occurred |

### 5. SESSIONS
Active user sessions for security tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Session owner |
| device_info | JSONB | Device details |
| ip_address | INET | Session IP |
| user_agent | TEXT | Browser info |
| created_at | TIMESTAMPTZ | Session start |
| last_active_at | TIMESTAMPTZ | Last activity |
| expires_at | TIMESTAMPTZ | Session expiry |

### 6. WALLETS
Multiple wallet support per user.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Wallet owner |
| address | VARCHAR(42) | Wallet address |
| chain_id | INTEGER | Blockchain network |
| is_primary | BOOLEAN | Primary wallet flag |
| verified_at | TIMESTAMPTZ | When wallet was verified |
| created_at | TIMESTAMPTZ | Record creation |

### 7. PHOTO_SHARES
Photo sharing between users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| photo_id | UUID | Shared photo |
| shared_by | UUID | Sharing user |
| shared_with | UUID | Recipient user |
| access_level | VARCHAR(20) | view/download/full |
| expires_at | TIMESTAMPTZ | Share expiry |
| created_at | TIMESTAMPTZ | Share creation |

### 8. VERIFICATIONS
Photo verification records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| photo_id | UUID | Verified photo |
| verified_by | UUID | Verifier user |
| verification_type | VARCHAR(50) | Type of verification |
| status | VARCHAR(20) | pending/verified/failed |
| signature | TEXT | Cryptographic signature |
| metadata | JSONB | Verification details |
| created_at | TIMESTAMPTZ | Verification time |

## Audit Log Action Types

| Action | Description |
|--------|-------------|
| `user.signup` | New user registration |
| `user.login` | User login |
| `user.logout` | User logout |
| `user.password_change` | Password changed |
| `profile.update` | Profile updated |
| `wallet.connect` | Wallet connected |
| `wallet.disconnect` | Wallet disconnected |
| `photo.upload` | Photo uploaded to IPFS |
| `photo.save_chain` | Photo CID saved to blockchain |
| `photo.delete` | Photo deleted |
| `photo.share` | Photo shared |
| `photo.verify` | Photo verified |
| `session.create` | New session created |
| `session.expire` | Session expired |

## Row Level Security (RLS) Policies

All tables use Supabase RLS:
- Users can only read/write their own data
- Audit logs are insert-only for users
- Admins have full access
- Shared photos are readable by recipients
