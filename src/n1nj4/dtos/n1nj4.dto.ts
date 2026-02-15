import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// ============ 身份验证请求 ============
export class VerifyN1NJ4Dto {
  @IsString()
  @IsNotEmpty()
  credentialId: string; // WebAuthn凭证ID

  @IsString()
  @IsNotEmpty()
  walletAddress: string; // Injective钱包地址 (inj1...)

  @IsString()
  @IsOptional()
  passkeyAttestation?: string; // Passkey验证数据（可选，用于未来扩展）
}

// ============ NFT状态 ============
export class NFTStatusDto {
  hasN1NJ4: boolean;
  tokenId: string | null;
  tier: string | null;
  acquiredAt?: number;
}

// ============ 身份验证响应 ============
export class VerifyN1NJ4ResponseDto {
  success: boolean;
  n1nj4Token: string; // JWT Token
  identityId: string; // 身份记录UUID
  walletAddress: string;
  nftStatus: NFTStatusDto;
  createdAt: number; // 时间戳（毫秒）
}

// ============ 身份信息 ============
export class IdentityInfoDto {
  walletAddress: string;
  isVerified: boolean;
  credentialId: string;
  reputationScore: number;
  lastVerifiedAt: number;
  nftStatus: NFTStatusDto;
}

// ============ 批量查询响应 ============
export class QueryIdentitiesResponseDto {
  identities: IdentityInfoDto[];
}

// ============ 信誉评分细分 ============
export class ReputationBreakdownDto {
  nftHolder: number; // NFT持有权重 (0-10)
  transactionCount: number; // 交易次数权重 (0-10)
  stakingDuration: number; // 质押时长权重 (0-10)
  verificationFrequency: number; // 验证频率权重 (0-10)
}

// ============ 信誉评分响应 ============
export class ReputationDto {
  credentialId: string;
  overallScore: number; // 总分 (0-100)
  breakdown: ReputationBreakdownDto;
  tier: string; // "Bronze", "Silver", "Gold", "Platinum"
  badges: string[];
}

// ============ 验证历史记录 ============
export class VerificationHistoryDto {
  date: number;
  walletAddress: string;
  status: string;
  nftStatus: boolean;
}

// ============ 开发者资料响应 ============
export class DeveloperProfileDto {
  credentialId: string;
  walletAddresses: string[];
  nftProfile: NFTStatusDto;
  reputation: ReputationDto;
  verificationHistory: VerificationHistoryDto[];
  createdAt: number;
  lastNftCheck: number;
}
