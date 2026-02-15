# N1NJ4 API 使用指南

> **快速上手**: 如何调用N1NJ4身份感知API的4个端点

---

## 📋 目录
1. [API基础信息](#api基础信息)
2. [端点1: 身份验证](#1️⃣-身份验证)
3. [端点2: 批量查询身份](#2️⃣-批量查询身份)
4. [端点3: 信誉评分](#3️⃣-信誉评分)
5. [端点4: 开发者资料](#4️⃣-开发者资料)
6. [集成示例](#集成示例)
7. [错误处理](#错误处理)

---

## API基础信息

**Base URL (本地开发)**:
```
http://localhost:3000
```

**Base URL (生产环境)**:
```
https://your-deployed-api.vercel.app
```

**认证**: 部分端点需要JWT Token (通过验证端点获取)

---

## 1️⃣ 身份验证

### 功能
验证用户身份，检查N1NJ4 NFT持有权，生成身份Token

### 端点信息
```
POST /api/v1/n1nj4/verify
Content-Type: application/json
```

### 请求参数
```typescript
{
  credentialId: string;        // WebAuthn凭证ID (必填)
  walletAddress: string;       // Injective钱包地址 (必填)
  passkeyAttestation?: string; // Passkey验证数据 (可选，未来扩展)
}
```

### cURL示例
```bash
curl -X POST http://localhost:3000/api/v1/n1nj4/verify \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": "abc123-your-credential-id",
    "walletAddress": "inj1abcdefghijklmnopqrstuvwxyz"
  }'
```

### JavaScript/TypeScript示例
```typescript
// 使用fetch API
async function verifyN1NJ4Identity(credentialId: string, walletAddress: string) {
  const response = await fetch('http://localhost:3000/api/v1/n1nj4/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credentialId,
      walletAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(`验证失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// 使用示例
const result = await verifyN1NJ4Identity(
  'your-credential-id',
  'inj1abcdefghijklmnopqrstuvwxyz'
);

console.log('身份Token:', result.n1nj4Token);
console.log('NFT状态:', result.nftStatus);
```

### 响应示例
```json
{
  "success": true,
  "n1nj4Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "identityId": "550e8400-e29b-41d4-a716-446655440000",
  "walletAddress": "inj1abcdefghijklmnopqrstuvwxyz",
  "nftStatus": {
    "hasN1NJ4": true,
    "tokenId": "12345",
    "tier": "Origin",
    "acquiredAt": 1707378000000
  },
  "createdAt": 1707378000000
}
```

### 使用场景
- ✅ 用户首次注册/登录
- ✅ 验证用户是否持有N1NJ4 NFT
- ✅ 获取身份Token用于后续API调用

---

## 2️⃣ 批量查询身份

### 功能
批量查询多个钱包地址的身份信息和NFT状态

### 端点信息
```
GET /api/v1/n1nj4/identities?walletAddresses=addr1,addr2,addr3
```

### 请求参数
- `walletAddresses`: 逗号分隔的钱包地址列表 (URL参数)

### cURL示例
```bash
# 查询单个钱包
curl "http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=inj1abc123"

# 查询多个钱包
curl "http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=inj1abc123,inj1def456,inj1ghi789"
```

### JavaScript/TypeScript示例
```typescript
async function queryN1NJ4Identities(walletAddresses: string[]) {
  const addressesParam = walletAddresses.join(',');
  const response = await fetch(
    `http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=${encodeURIComponent(addressesParam)}`
  );

  if (!response.ok) {
    throw new Error(`查询失败: ${response.statusText}`);
  }

  return await response.json();
}

// 使用示例
const identities = await queryN1NJ4Identities([
  'inj1abc123',
  'inj1def456',
  'inj1ghi789',
]);

identities.identities.forEach(identity => {
  console.log(`地址: ${identity.walletAddress}`);
  console.log(`已验证: ${identity.isVerified}`);
  console.log(`信誉分: ${identity.reputationScore}`);
  console.log(`持有NFT: ${identity.nftStatus.hasN1NJ4}`);
  console.log('---');
});
```

### 响应示例
```json
{
  "identities": [
    {
      "walletAddress": "inj1abc123",
      "isVerified": true,
      "credentialId": "credential-123",
      "reputationScore": 85,
      "lastVerifiedAt": 1707378000000,
      "nftStatus": {
        "hasN1NJ4": true,
        "tokenId": "12345",
        "tier": "Origin",
        "acquiredAt": 1707378000000
      }
    },
    {
      "walletAddress": "inj1def456",
      "isVerified": false,
      "credentialId": "",
      "reputationScore": 0,
      "lastVerifiedAt": 0,
      "nftStatus": {
        "hasN1NJ4": false,
        "tokenId": null,
        "tier": null
      }
    }
  ]
}
```

### 使用场景
- ✅ 展示用户列表时批量查询身份状态
- ✅ DAO投票前验证多个参与者
- ✅ 白名单验证
- ✅ 排行榜展示

---

## 3️⃣ 信誉评分

### 功能
获取开发者/用户的详细信誉评分和等级

### 端点信息
```
GET /api/v1/n1nj4/reputation/:credentialId
```

### 请求参数
- `credentialId`: WebAuthn凭证ID (URL路径参数)

### cURL示例
```bash
curl "http://localhost:3000/api/v1/n1nj4/reputation/your-credential-id"
```

### JavaScript/TypeScript示例
```typescript
async function getN1NJ4Reputation(credentialId: string) {
  const response = await fetch(
    `http://localhost:3000/api/v1/n1nj4/reputation/${credentialId}`
  );

  if (!response.ok) {
    throw new Error(`获取信誉评分失败: ${response.statusText}`);
  }

  return await response.json();
}

// 使用示例
const reputation = await getN1NJ4Reputation('your-credential-id');

console.log('总分:', reputation.overallScore);
console.log('等级:', reputation.tier);
console.log('徽章:', reputation.badges);

// 查看评分细分
console.log('NFT持有评分:', reputation.breakdown.nftHolder);
console.log('交易评分:', reputation.breakdown.transactionCount);
console.log('质押评分:', reputation.breakdown.stakingDuration);
console.log('活跃度评分:', reputation.breakdown.verificationFrequency);
```

### 响应示例
```json
{
  "credentialId": "your-credential-id",
  "overallScore": 85.5,
  "breakdown": {
    "nftHolder": 10.0,
    "transactionCount": 8.5,
    "stakingDuration": 9.2,
    "verificationFrequency": 7.8
  },
  "tier": "Gold",
  "badges": [
    "N1NJ4 Holder",
    "Early Adopter",
    "Active Developer",
    "Trusted"
  ]
}
```

### 评分权重说明
| 指标 | 权重 | 说明 |
|------|------|------|
| NFT持有 | 50% | 是否持有N1NJ4 NFT (最重要！) |
| 交易次数 | 15% | 基于验证次数模拟 |
| 质押时长 | 15% | 基于账户创建时间 |
| 验证频率 | 20% | 验证活跃度 |

### 等级说明
- **Platinum** (≥85分): 顶级用户
- **Gold** (70-84分): 优质用户
- **Silver** (55-69分): 良好用户
- **Bronze** (<55分): 普通用户

### 使用场景
- ✅ DeFi借贷平台决定信用额度
- ✅ DAO投票权重分配
- ✅ 优质用户筛选
- ✅ 风险评估

---

## 4️⃣ 开发者资料

### 功能
获取开发者的完整身份画像，包括所有钱包、NFT信息、信誉评分和历史记录

### 端点信息
```
GET /api/v1/n1nj4/developer/:credentialId
```

### 请求参数
- `credentialId`: WebAuthn凭证ID (URL路径参数)

### cURL示例
```bash
curl "http://localhost:3000/api/v1/n1nj4/developer/your-credential-id"
```

### JavaScript/TypeScript示例
```typescript
async function getDeveloperProfile(credentialId: string) {
  const response = await fetch(
    `http://localhost:3000/api/v1/n1nj4/developer/${credentialId}`
  );

  if (!response.ok) {
    throw new Error(`获取开发者资料失败: ${response.statusText}`);
  }

  return await response.json();
}

// 使用示例
const profile = await getDeveloperProfile('your-credential-id');

console.log('开发者ID:', profile.credentialId);
console.log('关联钱包:', profile.walletAddresses);
console.log('NFT信息:', profile.nftProfile);
console.log('信誉等级:', profile.reputation.tier);
console.log('信誉分数:', profile.reputation.overallScore);
console.log('账户创建时间:', new Date(profile.createdAt));
```

### 响应示例
```json
{
  "credentialId": "your-credential-id",
  "walletAddresses": [
    "inj1abcdefghijklmnopqrstuvwxyz"
  ],
  "nftProfile": {
    "hasN1NJ4": true,
    "tokenId": "12345",
    "tier": "Origin",
    "acquiredAt": 1707378000000
  },
  "reputation": {
    "credentialId": "your-credential-id",
    "overallScore": 85.5,
    "breakdown": {
      "nftHolder": 10.0,
      "transactionCount": 8.5,
      "stakingDuration": 9.2,
      "verificationFrequency": 7.8
    },
    "tier": "Gold",
    "badges": ["N1NJ4 Holder", "Early Adopter", "Active Developer"]
  },
  "verificationHistory": [
    {
      "date": 1707378000000,
      "walletAddress": "inj1abcdefghijklmnopqrstuvwxyz",
      "status": "verified",
      "nftStatus": true
    }
  ],
  "createdAt": 1707000000000,
  "lastNftCheck": 1707378000000
}
```

### 使用场景
- ✅ 开发者个人主页展示
- ✅ 招聘平台验证开发者背景
- ✅ 项目合作方筛选
- ✅ 社区成员档案

---

## 集成示例

### 完整的React组件示例

```tsx
import { useState, useEffect } from 'react';

// 定义类型
interface N1NJ4Identity {
  walletAddress: string;
  isVerified: boolean;
  credentialId: string;
  reputationScore: number;
  nftStatus: {
    hasN1NJ4: boolean;
    tokenId: string | null;
    tier: string | null;
  };
}

const N1NJ4IdentityChecker: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [identity, setIdentity] = useState<N1NJ4Identity | null>(null);
  const [loading, setLoading] = useState(false);

  const checkIdentity = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=${walletAddress}`
      );
      const data = await response.json();
      
      if (data.identities && data.identities.length > 0) {
        setIdentity(data.identities[0]);
      }
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>N1NJ4 身份查询</h2>
      
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="输入Injective钱包地址"
      />
      
      <button onClick={checkIdentity} disabled={loading}>
        {loading ? '查询中...' : '查询'}
      </button>

      {identity && (
        <div>
          <h3>身份信息</h3>
          <p>已验证: {identity.isVerified ? '✅' : '❌'}</p>
          <p>持有N1NJ4 NFT: {identity.nftStatus.hasN1NJ4 ? '✅' : '❌'}</p>
          <p>信誉评分: {identity.reputationScore}</p>
          {identity.nftStatus.hasN1NJ4 && (
            <p>NFT Token ID: {identity.nftStatus.tokenId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default N1NJ4IdentityChecker;
```

### Node.js服务端示例

```typescript
import axios from 'axios';

const N1NJ4_API_BASE = 'http://localhost:3000/api/v1/n1nj4';

class N1NJ4Client {
  /**
   * 验证身份
   */
  async verifyIdentity(credentialId: string, walletAddress: string) {
    const response = await axios.post(`${N1NJ4_API_BASE}/verify`, {
      credentialId,
      walletAddress,
    });
    return response.data;
  }

  /**
   * 批量查询身份
   */
  async queryIdentities(walletAddresses: string[]) {
    const addressesParam = walletAddresses.join(',');
    const response = await axios.get(
      `${N1NJ4_API_BASE}/identities?walletAddresses=${addressesParam}`
    );
    return response.data;
  }

  /**
   * 获取信誉评分
   */
  async getReputation(credentialId: string) {
    const response = await axios.get(
      `${N1NJ4_API_BASE}/reputation/${credentialId}`
    );
    return response.data;
  }

  /**
   * 获取开发者资料
   */
  async getDeveloperProfile(credentialId: string) {
    const response = await axios.get(
      `${N1NJ4_API_BASE}/developer/${credentialId}`
    );
    return response.data;
  }
}

// 使用示例
const client = new N1NJ4Client();

async function example() {
  // 1. 验证身份
  const verification = await client.verifyIdentity(
    'credential-123',
    'inj1abc...'
  );
  console.log('Token:', verification.n1nj4Token);

  // 2. 查询身份
  const identities = await client.queryIdentities(['inj1abc...', 'inj1def...']);
  console.log('查询结果:', identities);

  // 3. 获取信誉
  const reputation = await client.getReputation('credential-123');
  console.log('信誉等级:', reputation.tier);

  // 4. 获取资料
  const profile = await client.getDeveloperProfile('credential-123');
  console.log('开发者资料:', profile);
}
```

---

## 错误处理

### 常见错误响应

**400 Bad Request - 参数错误**
```json
{
  "statusCode": 400,
  "message": "Wallet address does not match credential",
  "error": "Bad Request"
}
```

**404 Not Found - 身份未找到**
```json
{
  "statusCode": 404,
  "message": "Identity not found",
  "error": "Not Found"
}
```

**500 Internal Server Error - 服务器错误**
```json
{
  "statusCode": 500,
  "message": "NFT verification not configured",
  "error": "Internal Server Error"
}
```

### 错误处理示例

```typescript
async function safeVerifyIdentity(credentialId: string, walletAddress: string) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/n1nj4/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId, walletAddress }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`参数错误: ${error.message}`);
        case 404:
          throw new Error('身份未找到');
        case 500:
          throw new Error(`服务器错误: ${error.message}`);
        default:
          throw new Error(`未知错误: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  }
}
```

---

## 实际应用场景

### 场景1: DeFi借贷平台
```typescript
// 根据信誉评分决定贷款额度
async function calculateLoanLimit(credentialId: string) {
  const reputation = await getN1NJ4Reputation(credentialId);
  
  let loanLimit = 0;
  
  if (reputation.tier === 'Platinum') {
    loanLimit = 100000; // $100k
  } else if (reputation.tier === 'Gold') {
    loanLimit = 50000;  // $50k
  } else if (reputation.tier === 'Silver') {
    loanLimit = 10000;  // $10k
  } else {
    loanLimit = 1000;   // $1k
  }
  
  // NFT持有者额外加成
  if (reputation.breakdown.nftHolder === 10) {
    loanLimit *= 1.5;
  }
  
  return loanLimit;
}
```

### 场景2: DAO投票权重
```typescript
// 根据信誉分和NFT状态计算投票权
async function calculateVotingPower(walletAddress: string) {
  const result = await queryN1NJ4Identities([walletAddress]);
  const identity = result.identities[0];
  
  if (!identity.isVerified) {
    return 1; // 未验证用户基础投票权
  }
  
  let votingPower = 1;
  
  // NFT持有者有更高投票权
  if (identity.nftStatus.hasN1NJ4) {
    votingPower = 5;
  }
  
  // 高信誉用户追加权重
  if (identity.reputationScore >= 80) {
    votingPower += 2;
  }
  
  return votingPower;
}
```

### 场景3: 白名单验证
```typescript
// 批量验证白名单用户
async function verifyWhitelist(walletAddresses: string[]) {
  const result = await queryN1NJ4Identities(walletAddresses);
  
  const qualified = result.identities.filter(identity => 
    identity.isVerified && 
    identity.nftStatus.hasN1NJ4 &&
    identity.reputationScore >= 70
  );
  
  return qualified.map(i => i.walletAddress);
}
```

---

## 快速测试

### 使用Postman/Insomnia导入

创建一个Collection包含所有端点：

```json
{
  "info": { "name": "N1NJ4 API" },
  "item": [
    {
      "name": "Verify Identity",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/n1nj4/verify",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"credentialId\": \"test-credential\",\n  \"walletAddress\": \"inj1test\"\n}"
        }
      }
    },
    {
      "name": "Query Identities",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=inj1test"
      }
    },
    {
      "name": "Get Reputation",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/n1nj4/reputation/test-credential"
      }
    },
    {
      "name": "Get Developer Profile",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/n1nj4/developer/test-credential"
      }
    }
  ]
}
```

---

## 总结

| 端点 | 用途 | 适用场景 |
|------|------|---------|
| POST /verify | 身份验证 | 用户注册、登录 |
| GET /identities | 批量查询 | 用户列表、白名单验证 |
| GET /reputation/:id | 信誉评分 | 信用决策、风险评估 |
| GET /developer/:id | 开发者资料 | 个人主页、简历验证 |

**开始集成吧！** 🚀
