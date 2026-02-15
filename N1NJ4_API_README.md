# N1NJ4 Identity-Aware API

> **黑客松项目**: Ninja API Forge - N1NJ4 Track  
> **类型**: Identity-Aware API for Developers  
> **技术栈**: NestJS + PostgreSQL + Ethers.js + Injective

一个专为Injective生态设计的N1NJ4身份感知API服务，通过验证N1NJ4 NFT持有权和Passkey凭证，为开发者提供可信的身份验证和信誉评分服务。

---

## 🎯 核心特性

- ✅ **N1NJ4 NFT验证**: 实时检查钱包是否持有N1NJ4:Origin NFT
- ✅ **Passkey身份绑定**: WebAuthn硬件级安全认证
- ✅ **信誉评分系统**: 基于NFT持有、链上活动计算可信度
- ✅ **开发者资料聚合**: 完整的身份画像和历史记录
- ✅ **RESTful API设计**: 清晰、标准化的端点设计
- ✅ **企业级代码质量**: NestJS框架，TypeORM，模块化架构

---

## 📡 API端点

### 1️⃣ 身份验证
```http
POST /api/v1/n1nj4/verify
Content-Type: application/json

{
  "credentialId": "base64EncodedCredentialId",
  "walletAddress": "inj1...",
  "passkeyAttestation": "optional"
}
```

**响应:**
```json
{
  "success": true,
  "n1nj4Token": "eyJhbGc...",
  "identityId": "uuid",
  "walletAddress": "inj1xxx...",
  "nftStatus": {
    "hasN1NJ4": true,
    "tokenId": "12345",
    "tier": "Origin",
    "acquiredAt": 1707378000
  },
  "createdAt": 1707378000
}
```

---

### 2️⃣ 查询身份信息
```http
GET /api/v1/n1nj4/identities?walletAddresses=inj1xxx,inj1yyy
```

**响应:**
```json
{
  "identities": [
    {
      "walletAddress": "inj1xxx",
      "isVerified": true,
      "credentialId": "...",
      "reputationScore": 85,
      "lastVerifiedAt": 1707378000,
      "nftStatus": {
        "hasN1NJ4": true,
        "tokenId": "12345",
        "tier": "Origin"
      }
    }
  ]
}
```

---

### 3️⃣ 信誉评分
```http
GET /api/v1/n1nj4/reputation/:credentialId
```

**响应:**
```json
{
  "credentialId": "...",
  "overallScore": 85.5,
  "breakdown": {
    "nftHolder": 10,
    "transactionCount": 8.5,
    "stakingDuration": 9.2,
    "verificationFrequency": 7.8
  },
  "tier": "Gold",
  "badges": ["N1NJ4 Holder", "Early Adopter", "Active Developer"]
}
```

**评分权重:**
- NFT持有: **50%**
- 交易次数: 15%
- 质押时长: 15%
- 验证频率: 20%

---

### 4️⃣ 开发者资料
```http
GET /api/v1/n1nj4/developer/:credentialId
```

**响应:**
```json
{
  "credentialId": "...",
  "walletAddresses": ["inj1xxx", "inj1yyy"],
  "nftProfile": {
    "hasN1NJ4": true,
    "tokenId": "12345",
    "tier": "Origin"
  },
  "reputation": {
    "overallScore": 85,
    "tier": "Gold",
    "badges": [...]
  },
  "verificationHistory": [...],
  "createdAt": 1707378000,
  "lastNftCheck": 1707378000
}
```

---

## 🚀 快速开始

### 1. 安装依赖
```bash
cd inj-pass-backend
pnpm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

**必需的环境变量:**
```env
# Injective RPC (用于检查NFT)
INJECTIVE_RPC_URL=https://testnet.sentry.tm.injective.network:443

# N1NJ4 NFT合约地址
NFT_CONTRACT_ADDRESS=0x816070929010a3d202d8a6b89f92bee33b7e8769

# 数据库连接
DATABASE_URL=postgresql://...

# Redis缓存
REDIS_URL=redis://...

# JWT密钥
JWT_SECRET=your-secret-key
```

### 3. 运行开发服务器
```bash
pnpm run start:dev
```

服务器将在 `http://localhost:3000` 启动

---

## 🏗️ 技术架构

```
inj-pass-backend/
├── src/
│   ├── n1nj4/                    ← 🆕 N1NJ4模块
│   │   ├── entities/
│   │   │   └── n1nj4-identity.entity.ts
│   │   ├── dtos/
│   │   │   └── n1nj4.dto.ts
│   │   ├── services/
│   │   │   ├── nft.service.ts     ← NFT检查逻辑
│   │   │   └── n1nj4.service.ts   ← 核心业务
│   │   ├── n1nj4.controller.ts    ← 4个API端点
│   │   └── n1nj4.module.ts
│   ├── passkey/                  ← 已有的Passkey模块
│   ├── auth/                     ← 已有的认证模块
│   └── app.module.ts
└── package.json
```

**数据流:**
```
客户端请求
    ↓
N1NJ4 Controller (4个端点)
    ↓
N1NJ4 Service (业务逻辑)
    ↓
NFT Service (检查N1NJ4 NFT) + PostgreSQL (存储)
    ↓
响应JSON
```

---

## 📊 数据库Schema

```sql
CREATE TABLE n1nj4_identities (
  id UUID PRIMARY KEY,
  credential_id VARCHAR UNIQUE NOT NULL,
  wallet_address VARCHAR NOT NULL,
  nft_token_id VARCHAR,
  nft_holder BOOLEAN DEFAULT false,
  nft_tier VARCHAR,
  reputation_score INT DEFAULT 50,
  is_verified BOOLEAN DEFAULT true,
  verification_count INT DEFAULT 1,
  badges TEXT[],
  tier VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified_at TIMESTAMP,
  last_nft_check TIMESTAMP
);

CREATE INDEX idx_credential_id ON n1nj4_identities(credential_id);
CREATE INDEX idx_wallet_address ON n1nj4_identities(wallet_address);
```

---

## 🎨 应用场景

### 场景1: DeFi借贷协议
```typescript
// 检查用户信誉评分，决定是否批准贷款
const { reputation } = await fetch('/api/v1/n1nj4/reputation/' + credentialId).then(r => r.json());

if (reputation.overallScore >= 75) {
  approveLoan(user);
}
```

### 场景2: DAO治理投票
```typescript
// N1NJ4持有者有更高投票权
const { identities } = await fetch('/api/v1/n1nj4/identities?walletAddresses=' + wallet).then(r => r.json());

const votingPower = identities[0].nftStatus.hasN1NJ4 ? 5 : 1;
```

### 场景3: 开发者市场
```typescript
// 显示已验证的开发者列表
const developers = await fetchAllDevelopers();
const verifiedDevs = developers.filter(d => d.reputation.tier === 'Gold');
```

---

## 🔍 Injective数据源

- **N1NJ4 NFT Contract**: `0x816070929010a3d202d8a6b89f92bee33b7e8769`
- **Network**: Injective Testnet
- **RPC**: Injective Sentry Node
- **使用的方法**:
  - `balanceOf(address)` - 检查NFT持有数量
  - `tokenOfOwnerByIndex(address, index)` - 获取Token ID

---

## 📝 API设计准则

遵循黑客松评分标准：

1. **API Design Quality** ✅
   - RESTful设计
   - 清晰的URL结构
   - 标准HTTP方法

2. **Practical Developer Usefulness** ✅
   - 真实的NFT验证
   - 实用的信誉评分
   - 批量查询支持

3. **Code Structure and Clarity** ✅
   - NestJS模块化
   - TypeScript类型安全
   - 详细的代码注释

4. **Reusability and Extensibility** ✅
   - 服务可独立复用
   - DTO标准化
   - 易于扩展新功能

---

## 🧪 测试

```bash
# 单元测试
pnpm run test

# E2E测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

---

## 📜 许可证

UNLICENSED (黑客松项目)

---

## 🏆 黑客松信息

- **竞赛**: Ninja API Forge
- **赛道**: Special Track - Identity-Aware APIs (N1NJ4 Track)
- **提交时间**: 2026年2月15日
- **GitHub**: https://github.com/injective-labs/INJ_Pass

---

## 🙏 致谢

- Injective Labs - 提供强大的区块链基础设施
- N1NJ4 Labs - NFT原语和身份验证概念
- Moonshot Commons - 主办Ninja API Forge黑客松

---

**Built with ❤️ for Injective Ecosystem**
