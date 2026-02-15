# Passkey + 钱包地址绑定方案

## 问题背景

WebAuthn 公钥（数据库中的 `publicKey` 字段）**无法直接解析成 Injective 钱包地址**，原因：

| 技术 | 椭圆曲线算法 | 地址格式 |
|------|-------------|----------|
| WebAuthn Passkey | ECDSA P-256 / EdDSA | 无区块链地址 |
| Injective 钱包 | secp256k1 | Bech32 (inj1...) |

✅ **解决方案**: 让用户提供钱包地址 + 签名验证所有权

---

## 方案1: 简单绑定（当前实现）

### 流程
```
用户 → 提供 credentialId + walletAddress
     ↓
API  → 检查 NFT 持有状态
     ↓
     → 创建绑定记录
```

### 优点
- ✅ 实现简单
- ✅ 用户体验流畅

### 缺点
- ⚠️ 用户可以随意输入任何地址（无所有权验证）
- ⚠️ 存在冒用他人地址的可能

### 代码示例
```typescript
// 当前实现（src/n1nj4/n1nj4.controller.ts）
@Post('verify')
async verifyIdentity(@Body() dto: VerifyN1NJ4Dto) {
  // ⚠️ 只检查 NFT，不验证地址所有权
  return this.n1nj4Service.verifyIdentity(dto);
}
```

---

## 方案2: 钱包签名验证（推荐）⭐

### 流程
```
1. 用户用 Keplr/Metamask 签名一条消息
2. 后端验证签名确认地址所有权
3. 绑定 credentialId ↔ walletAddress
```

### 实现步骤

#### 1. 修改 DTO 增加签名字段
```typescript
// src/n1nj4/dtos/n1nj4.dto.ts
export class VerifyN1NJ4Dto {
  @IsNotEmpty()
  credentialId: string;

  @IsNotEmpty()
  walletAddress: string;

  // 新增：用户签名
  @IsNotEmpty()
  signature: string; // 用户用钱包签名的结果

  // 新增：签名的原始消息
  @IsNotEmpty()
  message: string; // 例如: "Bind N1NJ4 identity: {credentialId}"
}
```

#### 2. 创建签名验证服务
```typescript
// src/n1nj4/services/wallet-signature.service.ts
import { Injectable } from '@nestjs/common';
import { verifyMessage } from '@ethersproject/wallet'; // ethers.js 提供

@Injectable()
export class WalletSignatureService {
  /**
   * 验证 Injective 钱包签名
   * @param message 原始消息
   * @param signature 签名
   * @param expectedAddress 声称的地址
   */
  verifyInjectiveSignature(
    message: string,
    signature: string,
    expectedAddress: string,
  ): boolean {
    try {
      // 1. 从签名中恢复地址
      const recoveredAddress = verifyMessage(message, signature);
      
      // 2. 转换为 Injective 格式（bech32 inj1...）
      const injectiveAddress = this.convertToInjectiveAddress(recoveredAddress);
      
      // 3. 比对地址
      return injectiveAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * 将以太坊格式地址转为 Injective bech32 格式
   */
  private convertToInjectiveAddress(ethAddress: string): string {
    // Injective 使用 bech32 编码
    // 需要: @cosmjs/encoding
    const { fromHex, toBech32 } = require('@cosmjs/encoding');
    const addressBytes = fromHex(ethAddress.slice(2)); // 移除 0x
    return toBech32('inj', addressBytes);
  }
}
```

#### 3. 在 Service 中验证签名
```typescript
// src/n1nj4/services/n1nj4.service.ts
@Injectable()
export class N1NJ4Service {
  constructor(
    // ... 其他依赖
    private readonly walletSignatureService: WalletSignatureService,
  ) {}

  async verifyIdentity(dto: VerifyN1NJ4Dto) {
    // ✅ 验证钱包地址所有权
    const isValidSignature = this.walletSignatureService.verifyInjectiveSignature(
      dto.message,
      dto.signature,
      dto.walletAddress,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    // 继续原有逻辑...
    const nftStatus = await this.nftService.checkN1NJ4Ownership(dto.walletAddress);
    // ...
  }
}
```

#### 4. 前端集成示例
```typescript
// 前端代码（React + @keplr-wallet/cosmos）
import { Keplr } from '@keplr-wallet/types';

async function bindWalletToPasskey(credentialId: string) {
  // 1. 连接 Keplr 钱包
  const keplr = window.keplr as Keplr;
  await keplr.enable('injective-1');
  
  // 2. 获取地址
  const accounts = await keplr.getOfflineSigner('injective-1').getAccounts();
  const walletAddress = accounts[0].address;
  
  // 3. 生成签名消息
  const message = `Bind N1NJ4 identity: ${credentialId}`;
  
  // 4. 请求签名
  const signature = await keplr.signArbitrary(
    'injective-1',
    walletAddress,
    message,
  );
  
  // 5. 发送到后端验证
  const response = await fetch('/api/v1/n1nj4/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentialId,
      walletAddress,
      message,
      signature: signature.signature,
    }),
  });
  
  return response.json();
}
```

---

## 方案3: 混合模式（推荐黑客松）⭐⭐

### 特点
- ✅ 首次绑定：要求签名验证（严格）
- ✅ 后续查询：只需 credentialId（便捷）
- ✅ 兼顾安全性和用户体验

### 实现
```typescript
// 验证时检查是否已绑定
async verifyIdentity(dto: VerifyN1NJ4Dto) {
  const existing = await this.repository.findOne({
    where: { credentialId: dto.credentialId },
  });

  if (existing) {
    // 已绑定：直接使用已存储的地址
    return this.updateExistingIdentity(existing);
  } else {
    // 首次绑定：必须提供签名验证
    if (!dto.signature || !dto.message) {
      throw new BadRequestException(
        'First-time binding requires wallet signature',
      );
    }
    
    // 验证签名
    const isValid = this.walletSignatureService.verifyInjectiveSignature(
      dto.message,
      dto.signature,
      dto.walletAddress,
    );
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }
    
    // 创建新绑定
    return this.createNewIdentity(dto);
  }
}
```

---

## 依赖安装

```bash
# 安装签名验证所需的包
pnpm add @cosmjs/encoding @cosmjs/crypto
pnpm add @ethersproject/wallet  # ethers.js 已安装
```

---

## 推荐方案：方案3（混合模式）

**理由：**
1. ✅ 黑客松评审看重安全性（防止地址冒用）
2. ✅ 用户体验好（绑定后无需重复签名）
3. ✅ 技术亮点（展示密码学应用能力）

**实现工作量：**
- 新增文件：`wallet-signature.service.ts`（~50行代码）
- 修改文件：`n1nj4.dto.ts`（+3个字段）、`n1nj4.service.ts`（+15行验证逻辑）
- 总计：约1小时工作量

---

## 下一步行动

选择你要实现的方案：

- **方案1**: 保持当前实现（快速提交，但安全性弱）
- **方案2**: 完整签名验证（最安全，但用户每次都要签名）
- **方案3**: 混合模式（**推荐**）⭐

告诉我你的选择，我可以立即帮你实现！🚀
