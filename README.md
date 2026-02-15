# Ninja-ID-API

A comprehensive identity verification and reputation scoring API built on the Injective blockchain. Ninja-ID combines NFT ownership verification, multi-dimensional reputation scoring, and Passkey authentication to create a trustworthy identity platform.

## What This API Does

**Ninja-ID-API** provides:

- 🔐 **NFT-Based Identity Verification** - Verify N1NJ4 NFT ownership on Injective
- ⭐ **Multi-Dimensional Reputation Scoring** - Calculate reputation based on:
  - NFT Holder status (50%)
  - Transaction history (15%)
  - Staking duration (15%)
  - Verification frequency (20%)
- 🔑 **Passkey Authentication** - WebAuthn-based secure authentication
- 📊 **Real-Time Blockchain Data** - Live transaction tracking via Blockscout API
- 🏅 **Tier-Based Badges** - Bronze, Silver, Gold, Platinum tiers based on reputation

## Main Endpoints

### Authentication
- **POST** `/api/passkey/challenge` - Generate a Passkey challenge for registration/authentication
  - Query: `action` (register|authenticate)
  - Response: Challenge and expiration details

- **POST** `/api/passkey/verify` - Verify Passkey credential
  - Body: `credentialId`, `response`
  - Response: JWT session token

### N1NJ4 Identity API
- **POST** `/api/v1/n1nj4/verify` - Verify N1NJ4 NFT ownership and create/update identity
  - Header: `X-Wallet-Address`
  - Body: `walletAddress`, `credentialId`
  - Response: JWT token + Identity details with reputation score
  - Returns 401 if no N1NJ4 NFT found

- **GET** `/api/v1/n1nj4/reputation/:credentialId` - Fetch reputation score for a verified identity
  - Response: Overall score, breakdown by component, tier, badges

### Health Check
- **GET** `/health` - API health status with database/Redis/Blockscout connectivity

## Injective Data Sources

### 1. **Injective RPC** (NFT Verification)
- **URL**: `https://k8s.testnet.json-rpc.injective.network`
- **Purpose**: Query N1NJ4 NFT contract (ERC721) for ownership verification
- **Contract**: `0x3d5D8D565a20e648bD478FDC831b6576CEC54ab2`
- **Method**: `balanceOf()` to check if wallet holds N1NJ4 NFT
- **Data Used**: Checks NFT balance to verify identity

### 2. **Blockscout API** (Transaction History)
- **URL**: `https://testnet.blockscout-api.injective.network`
- **Purpose**: Retrieve transaction history for reputation scoring
- **Data Used**: Live transaction count, timestamps, gas usage
- **Endpoint**: `/api/v2/addresses/{address}/transactions`
- **Use Case**: Real-time scores based on actual blockchain activity

### 3. **PostgreSQL (Supabase)**
- **Purpose**: Store verified identities and reputation scores
- **Tables**: 
  - `n1nj4_identity` - User credentials, reputation scores, verification history
  - `passkey_credential` - WebAuthn credentials

### 4. **Redis (Upstash)**
- **Purpose**: Cache JWT sessions and challenge tokens
- **TTL**: 30 minutes for sessions, 10 minutes for challenges

## How to Run Locally

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL (Supabase connection string)
- Redis (Upstash connection string)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/injective-labs/Ninja-ID-API.git
cd inj-pass-backend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
Copy `.env.example` to `.env` and fill in:
```env
# Server
PORT=3000
NODE_ENV=development

# Passkey Config
RP_ID=localhost
ORIGINS=http://localhost:3001

# JWT Token
JWT_SECRET=your-secret-key

# PostgreSQL (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Upstash)
REDIS_URL=rediss://default:password@host:6379

# Injective
INJECTIVE_RPC_URL=https://k8s.testnet.json-rpc.injective.network
NFT_CONTRACT_ADDRESS=0x3d5D8D565a20e648bD478FDC831b6576CEC54ab2

# Blockscout API
BLOCKSCOUT_API_URL=https://testnet.blockscout-api.injective.network
```

4. **Run in development mode**
```bash
pnpm run start:dev
```
API will be available at `http://localhost:3000`

5. **Build for production**
```bash
pnpm run build
pnpm run start:prod
```

## Testing

```bash
# Test Passkey Challenge
curl -X POST http://localhost:3000/api/passkey/challenge \
  -H "Content-Type: application/json" \
  -d '{"action":"register"}'

# Test N1NJ4 Reputation
curl http://localhost:3000/api/v1/n1nj4/reputation/{credentialId}

# Test Health
curl http://localhost:3000/health
```

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL (TypeORM)
- **Cache**: Redis
- **Blockchain**: ethers.js v5.7.2 + Injective RPC
- **Address Conversion**: bech32 (Injective to EVM)
- **Authentication**: WebAuthn + JWT
- **HTTP Client**: axios
- **Deployment**: Vercel Serverless

## Network

**Injective Testnet**
- Chain ID: 1439
- RPC: https://k8s.testnet.json-rpc.injective.network
- N1NJ4 NFT Contract: 0x3d5D8D565a20e648bD478FDC831b6576CEC54ab2
- Blockscout Explorer: https://testnet.blockscout-api.injective.network

## Live Demo

- **API URL**: https://ninja-id-api.vercel.app
- **Frontend**: https://inj-pass-frontend-test.vercel.app

## License

MIT
