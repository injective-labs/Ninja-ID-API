# N1NJ4 API 快速参考

## 🚀 4个端点速查表

| # | 端点 | 方法 | 用途 |
|---|------|------|------|
| 1 | `/api/v1/n1nj4/verify` | POST | 验证身份，检查NFT |
| 2 | `/api/v1/n1nj4/identities` | GET | 批量查询身份 |
| 3 | `/api/v1/n1nj4/reputation/:id` | GET | 获取信誉评分 |
| 4 | `/api/v1/n1nj4/developer/:id` | GET | 获取开发者资料 |

---

## 📝 快速测试命令

### 1. 验证身份
```bash
curl -X POST http://localhost:3000/api/v1/n1nj4/verify \
  -H "Content-Type: application/json" \
  -d '{"credentialId":"test123","walletAddress":"inj1abc..."}'
```

### 2. 查询身份
```bash
curl "http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=inj1abc,inj1def"
```

### 3. 信誉评分
```bash
curl "http://localhost:3000/api/v1/n1nj4/reputation/test123"
```

### 4. 开发者资料
```bash
curl "http://localhost:3000/api/v1/n1nj4/developer/test123"
```

---

## 💡 使用技巧

### JavaScript一行代码
```javascript
// 验证
fetch('http://localhost:3000/api/v1/n1nj4/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credentialId:'test',walletAddress:'inj1...'})}).then(r=>r.json()).then(console.log)

// 查询
fetch('http://localhost:3000/api/v1/n1nj4/identities?walletAddresses=inj1...').then(r=>r.json()).then(console.log)

// 评分
fetch('http://localhost:3000/api/v1/n1nj4/reputation/test').then(r=>r.json()).then(console.log)

// 资料
fetch('http://localhost:3000/api/v1/n1nj4/developer/test').then(r=>r.json()).then(console.log)
```

---

## 🎯 典型响应示例

### 验证成功
```json
{
  "success": true,
  "n1nj4Token": "eyJhbGc...",
  "identityId": "uuid",
  "nftStatus": {"hasN1NJ4": true, "tokenId": "123"}
}
```

### 信誉评分
```json
{
  "overallScore": 85.5,
  "tier": "Gold",
  "badges": ["N1NJ4 Holder", "Trusted"]
}
```

---

## ⚠️ 常见错误

| 错误码 | 原因 | 解决方法 |
|--------|------|---------|
| 400 | 参数错误 | 检查请求参数 |
| 404 | 身份未找到 | 先调用verify创建身份 |
| 500 | 服务器错误 | 检查环境变量配置 |

---

## 🔧 环境变量检查清单

```bash
# 必需的环境变量
✓ INJECTIVE_RPC_URL       # Injective RPC地址
✓ NFT_CONTRACT_ADDRESS    # N1NJ4 NFT合约地址
✓ DATABASE_URL            # PostgreSQL连接
✓ REDIS_URL               # Redis连接
✓ JWT_SECRET              # JWT密钥
```

---

## 📊 信誉评分权重

| 指标 | 权重 | 满分 |
|------|------|------|
| NFT持有 | 50% | 10分 |
| 交易次数 | 15% | 10分 |
| 质押时长 | 15% | 10分 |
| 验证频率 | 20% | 10分 |

**等级划分:**
- Platinum: ≥85
- Gold: 70-84
- Silver: 55-69
- Bronze: <55

---

## 🧪 快速测试脚本

### Bash版本
```bash
chmod +x test-n1nj4-api.sh
./test-n1nj4-api.sh
```

### Node.js版本
```bash
node test-n1nj4-api.js
```

---

## 🔗 更多资源

- 📖 [完整API文档](./API_USAGE_GUIDE.md)
- 📚 [项目README](./N1NJ4_API_README.md)
- 🐛 [GitHub Issues](https://github.com/injective-labs/INJ_Pass/issues)

---

**最后更新**: 2026年2月15日
