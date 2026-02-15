# Ninja ID API (N1NJ4) — Quickstart / 使用说明

A NestJS API providing identity-aware endpoints gated by N1NJ4 NFT ownership. Routes are under the global prefix `/api`.

## Prerequisites / 前置依赖
- Node.js 18+ (LTS 推荐)
- pnpm 或 npm（示例使用 pnpm）
- PostgreSQL 数据库（本地或 Supabase）
- Redis（本地或 Upstash）
- Injective EVM JSON-RPC 节点 URL
- 已部署的 N1NJ4 ERC-721 合约地址（Injective EVM）

## Setup / 本地运行
1) 配置环境变量（复制并修改 .env）
```bash
cp .env.example .env
```
2) 安装依赖并启动
```bash
pnpm install
pnpm start:dev
```
默认启动在 `http://localhost:3001`，全局前缀为 `/api`。

## Required Environment / 必需环境变量
见 [.env.example](./.env.example)。关键项：
- `DATABASE_URL`: PostgreSQL 连接串（支持 Supabase）
- `REDIS_URL`: Redis 连接串（支持 Upstash）
- `JWT_SECRET`: 用于签发 API Token
- `INJECTIVE_RPC_URL`: Injective EVM 的 JSON-RPC
- `NFT_CONTRACT_ADDRESS`: N1NJ4 ERC-721 合约地址
- `BLOCKSCOUT_API_URL`: Blockscout API（默认已配置测试网）
- `RP_ID`, `ORIGINS`: Passkey 服务必须（即使暂不使用，也需提供）

## Endpoints / 接口说明
Base URL: `http://localhost:3001/api`

1) POST `/v1/n1nj4/verify` — 验证身份（严格 NFT-Gating）
- 仅 N1NJ4 NFT 持有者可通过并获得 `n1nj4Token`。
- Request Body:
```json
{
  "walletAddress": "inj1abc...xyz",
  "credentialId": "cred_12345"
}
```
- cURL:
```bash
curl -X POST \
  http://localhost:3001/api/v1/n1nj4/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "inj1yourwallet...",
    "credentialId": "cred_demo_001"
  }'
```
- 成功响应 (示例):
```json
{
  "success": true,
  "n1nj4Token": "<JWT>",
  "identityId": "<uuid>",
  "walletAddress": "inj1...",
  "nftStatus": { "hasN1NJ4": true, "tokenId": "1", "tier": "Origin", "acquiredAt": 173xxx }
}
```
- 非持有者返回 `401 Unauthorized`。

2) GET `/v1/n1nj4/identities?walletAddresses=inj1a,inj1b` — 批量查询身份
- cURL:
```bash
curl "http://localhost:3001/api/v1/n1nj4/identities?walletAddresses=inj1aaa...,inj1bbb..."
```
- 响应 (示例):
```json
{
  "identities": [
    {
      "walletAddress": "inj1aaa...",
      "isVerified": true,
      "credentialId": "cred_demo_001",
      "reputationScore": 72.5,
      "lastVerifiedAt": 173xxx,
      "nftStatus": { "hasN1NJ4": true, "tokenId": "1", "tier": "Origin", "acquiredAt": 173xxx }
    },
    { "walletAddress": "inj1bbb...", "isVerified": false, "credentialId": "", "reputationScore": 0, "lastVerifiedAt": 0, "nftStatus": { "hasN1NJ4": false, "tokenId": null, "tier": null } }
  ]
}
```

3) GET `/v1/n1nj4/reputation/:credentialId` — 获取信誉评分
- cURL:
```bash
curl "http://localhost:3001/api/v1/n1nj4/reputation/cred_demo_001"
```
- 响应 (示例):
```json
{
  "credentialId": "cred_demo_001",
  "overallScore": 78.4,
  "breakdown": {
    "nftHolder": 10,
    "transactionCount": 8.5,
    "stakingDuration": 6.2,
    "verificationFrequency": 7.0
  },
  "tier": "Gold",
  "badges": ["N1NJ4 Holder","Active Developer"]
}
```

4) GET `/v1/n1nj4/developer/:credentialId` — 开发者档案
- cURL:
```bash
curl "http://localhost:3001/api/v1/n1nj4/developer/cred_demo_001"
```
- 响应包含钱包、NFT 画像、信誉评分与简要验证历史。

## Notes / 说明
- 全局前缀为 `api`，所以完整路径形如：`/api/v1/n1nj4/...`
- `INJECTIVE_RPC_URL` 与 `NFT_CONTRACT_ADDRESS` 未配置将导致 `verify` 报错或返回未持有。
- `RP_ID` 与 `ORIGINS` 为 Passkey 服务所需；模块已加载，必须配置。
- CORS：`ORIGINS` 列表内来源允许跨域；Postman/cURL（无 Origin）默认放行。

## Health Check / 健康检查
- 基础信息: `GET /api` 返回运行环境及集成状态（DB/Redis/Blockscout）。

如需我直接填好 `.env` 示例中的测试网参数或加一个一键测试脚本（shell/cURL），告诉我你的偏好即可。
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
curl -X POST http: https://ninja-id-api.vercel.app/api/passkey/challenge \
  -H "Content-Type: application/json" \
  -d '{"action":"register"}'

# Test N1NJ4 Reputation
curl http:// https://ninja-id-api.vercel.app/api/v1/n1nj4/reputation/{credentialId}

# Test Health
curl http:// https://ninja-id-api.vercel.app/health
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
