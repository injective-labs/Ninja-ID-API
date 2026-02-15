import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuthService } from '../../auth/auth.service';
import { N1NJ4Identity } from '../entities/n1nj4-identity.entity';
import { NFTService } from './nft.service';
import {
  VerifyN1NJ4Dto,
  VerifyN1NJ4ResponseDto,
  QueryIdentitiesResponseDto,
  IdentityInfoDto,
  ReputationDto,
  ReputationBreakdownDto,
  DeveloperProfileDto,
  VerificationHistoryDto,
  NFTStatusDto,
} from '../dtos/n1nj4.dto';

@Injectable()
export class N1NJ4Service {
  private readonly logger = new Logger(N1NJ4Service.name);

  constructor(
    @InjectRepository(N1NJ4Identity)
    private readonly identityRepository: Repository<N1NJ4Identity>,
    private readonly authService: AuthService,
    private readonly nftService: NFTService,
  ) {}

  /**
   * API 端点 1️⃣: 身份验证
   * POST /api/v1/n1nj4/verify
   * 
   * 核心逻辑:
   * 1. 检查钱包是否持有N1NJ4 NFT (使用NFTService)
   * 2. 创建或更新身份记录
   * 3. 生成JWT Token
   */
  async verifyIdentity(dto: VerifyN1NJ4Dto): Promise<VerifyN1NJ4ResponseDto> {
    this.logger.log(
      `[N1NJ4 Verify] Processing - Wallet: ${dto.walletAddress}, Credential: ${dto.credentialId.substring(0, 20)}...`,
    );

    try {
      // ⭐ 第1步: 检查N1NJ4 NFT所有权
      const nftStatus = await this.nftService.checkN1NJ4Ownership(
        dto.walletAddress,
      );

      // ⭐ 严格模式: 只有NFT持有者才能验证身份
      if (!nftStatus.hasN1NJ4) {
        this.logger.warn(
          `[N1NJ4 Verify] ❌ Rejected - No NFT found for wallet: ${dto.walletAddress}`,
        );
        throw new UnauthorizedException(
          'N1NJ4 NFT required. Please mint your N1NJ4:Origin NFT at https://n1nj4.io to access this API.',
        );
      }

      this.logger.log(
        `[N1NJ4 Verify] ✅ NFT Verified - Token ID: ${nftStatus.tokenId}`,
      );

      // 第2步: 检查凭证是否已存在
      let identity = await this.identityRepository.findOne({
        where: { credentialId: dto.credentialId },
      });

      if (!identity) {
        // 创建新身份记录
        identity = this.identityRepository.create({
          credentialId: dto.credentialId,
          walletAddress: dto.walletAddress,
          nftTokenId: nftStatus.tokenId,
          nftHolder: nftStatus.hasN1NJ4,
          nftTier: nftStatus.tier,
          reputationScore: this.calculateInitialScore(nftStatus.hasN1NJ4),
          isVerified: true,
          verificationCount: 1,
          badges: this.generateInitialBadges(nftStatus.hasN1NJ4),
          tier: this.getTierFromScore(
            this.calculateInitialScore(nftStatus.hasN1NJ4),
          ),
          lastVerifiedAt: new Date(),
          lastNftCheck: new Date(),
        });

        await this.identityRepository.save(identity);
        this.logger.log(`[N1NJ4 Verify] ✅ Created new identity: ${identity.id}`);
      } else {
        // 更新已存在的记录
        if (identity.walletAddress !== dto.walletAddress) {
          throw new BadRequestException(
            'Wallet address does not match credential',
          );
        }

        // 更新NFT状态和验证信息
        identity.nftTokenId = nftStatus.tokenId || '';
        identity.nftHolder = nftStatus.hasN1NJ4;
        identity.nftTier = nftStatus.tier || '';
        identity.lastVerifiedAt = new Date();
        identity.lastNftCheck = new Date();
        identity.verificationCount += 1;

        // 重新计算信誉分
        const reputation = await this.calculateReputation(identity);
        identity.reputationScore = reputation.overallScore;
        identity.tier = reputation.tier;
        identity.badges = reputation.badges;

        await this.identityRepository.save(identity);
        this.logger.log(`[N1NJ4 Verify] ✅ Updated identity: ${identity.id}`);
      }

      // 第3步: 生成N1NJ4 Token (JWT)
      const n1nj4Token = await this.authService.generateToken(
        dto.credentialId,
        identity.id,
      );

      // 第4步: 返回响应
      return {
        success: true,
        n1nj4Token,
        identityId: identity.id,
        walletAddress: dto.walletAddress,
        nftStatus,
        createdAt: identity.createdAt.getTime(),
      };
    } catch (error) {
      this.logger.error(`[N1NJ4 Verify] Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * API 端点 2️⃣: 查询身份信息
   * GET /api/v1/n1nj4/identities?walletAddresses=inj1xxx,inj1yyy
   */
  async queryIdentities(
    walletAddresses: string[],
  ): Promise<QueryIdentitiesResponseDto> {
    this.logger.log(
      `[N1NJ4 Query] Querying ${walletAddresses.length} wallet(s)`,
    );

    try {
      // 从数据库查询这些钱包地址对应的身份
      const identities = await this.identityRepository.find({
        where: {
          walletAddress: In(walletAddresses),
        },
      });

      // 批量检查NFT状态 (可选，用于验证最新状态)
      const nftStatuses = await this.nftService.batchCheckN1NJ4Ownership(
        walletAddresses,
      );

      // 转换为响应格式
      const identityInfos: IdentityInfoDto[] = walletAddresses.map(
        (walletAddr) => {
          const identity = identities.find(
            (i) => i.walletAddress.toLowerCase() === walletAddr.toLowerCase(),
          );

          if (!identity) {
            // 如果钱包未验证过，返回默认信息
            const nftStatus = nftStatuses.get(walletAddr.toLowerCase()) || {
              hasN1NJ4: false,
              tokenId: null,
              tier: null,
            };

            return {
              walletAddress: walletAddr,
              isVerified: false,
              credentialId: '',
              reputationScore: 0,
              lastVerifiedAt: 0,
              nftStatus,
            };
          }

          // 如果已验证，返回完整信息
          const nftStatus: NFTStatusDto = {
            hasN1NJ4: identity.nftHolder,
            tokenId: identity.nftTokenId,
            tier: identity.nftTier,
            acquiredAt: identity.lastNftCheck?.getTime(),
          };

          return {
            walletAddress: walletAddr,
            isVerified: identity.isVerified,
            credentialId: identity.credentialId,
            reputationScore: identity.reputationScore,
            lastVerifiedAt: identity.lastVerifiedAt?.getTime() || 0,
            nftStatus,
          };
        },
      );

      return {
        identities: identityInfos,
      };
    } catch (error) {
      this.logger.error(`[N1NJ4 Query] Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * API 端点 3️⃣: 信誉评分
   * GET /api/v1/n1nj4/reputation/:credentialId
   */
  async getReputation(credentialId: string): Promise<ReputationDto> {
    this.logger.log(
      `[N1NJ4 Reputation] Getting reputation for: ${credentialId.substring(0, 20)}...`,
    );

    const identity = await this.identityRepository.findOne({
      where: { credentialId },
    });

    if (!identity) {
      throw new BadRequestException('Identity not found');
    }

    return this.calculateReputation(identity);
  }

  /**
   * API 端点 4️⃣: 开发者资料
   * GET /api/v1/n1nj4/developer/:credentialId
   */
  async getDeveloperProfile(
    credentialId: string,
  ): Promise<DeveloperProfileDto> {
    this.logger.log(
      `[N1NJ4 Developer] Getting profile for: ${credentialId.substring(0, 20)}...`,
    );

    const identity = await this.identityRepository.findOne({
      where: { credentialId },
    });

    if (!identity) {
      throw new BadRequestException('Identity not found');
    }

    const reputation = await this.calculateReputation(identity);

    const nftProfile: NFTStatusDto = {
      hasN1NJ4: identity.nftHolder,
      tokenId: identity.nftTokenId,
      tier: identity.nftTier,
      acquiredAt: identity.lastNftCheck?.getTime(),
    };

    // 构建验证历史（简化版，仅显示最后一次）
    const verificationHistory: VerificationHistoryDto[] = [
      {
        date: identity.lastVerifiedAt?.getTime() || 0,
        walletAddress: identity.walletAddress,
        status: 'verified',
        nftStatus: identity.nftHolder,
      },
    ];

    return {
      credentialId,
      walletAddresses: [identity.walletAddress], // 目前只支持一个钱包
      nftProfile,
      reputation,
      verificationHistory,
      createdAt: identity.createdAt.getTime(),
      lastNftCheck: identity.lastNftCheck?.getTime() || 0,
    };
  }

  /**
   * 计算信誉评分
   * 权重分配:
   * - NFT持有: 50%
   * - 交易次数: 15%
   * - 质押时长: 15%
   * - 验证频率: 20%
   */
  private async calculateReputation(
    identity: N1NJ4Identity,
  ): Promise<ReputationDto> {
    // 1. NFT持有评分 (权重50%)
    const nftScore = identity.nftHolder ? 10 : 0;

    // 2. 交易次数评分 (权重15%) - 从链上实际查询
    let transactionScore = 0;
    try {
      const txCount = await this.nftService.getTransactionCount(
        identity.walletAddress,
      );
      // 每5笔交易得1分，最高10分
      transactionScore = Math.min(10, txCount / 5);
      this.logger.debug(
        `Transaction count for ${identity.walletAddress}: ${txCount}, score: ${transactionScore}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to get transaction count, using fallback: ${error.message}`,
      );
      // 降级方案：基于验证次数模拟
      transactionScore = Math.min(10, (identity.verificationCount || 1) * 2);
    }

    // 3. 质押时长评分 (权重15%) - 基于账户年龄
    const daysSinceCreation =
      (Date.now() - identity.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const stakingScore = Math.min(10, daysSinceCreation / 10);

    // 4. 验证频率评分 (权重20%) - 基于验证次数
    const verificationScore = Math.min(
      10,
      (identity.verificationCount || 1) * 1.5,
    );

    // 计算加权总分
    const breakdown: ReputationBreakdownDto = {
      nftHolder: parseFloat(nftScore.toFixed(1)),
      transactionCount: parseFloat(transactionScore.toFixed(1)),
      stakingDuration: parseFloat(stakingScore.toFixed(1)),
      verificationFrequency: parseFloat(verificationScore.toFixed(1)),
    };

    const overallScore =
      nftScore * 0.5 +
      transactionScore * 0.15 +
      stakingScore * 0.15 +
      verificationScore * 0.2;

    const tier = this.getTierFromScore(overallScore);
    const badges = this.generateBadges(identity, overallScore);

    return {
      credentialId: identity.credentialId,
      overallScore: parseFloat(overallScore.toFixed(1)),
      breakdown,
      tier,
      badges,
    };
  }

  /**
   * 根据分数确定等级
   */
  private getTierFromScore(score: number): string {
    if (score >= 85) return 'Platinum';
    if (score >= 70) return 'Gold';
    if (score >= 55) return 'Silver';
    return 'Bronze';
  }

  /**
   * 生成徽章
   */
  private generateBadges(identity: N1NJ4Identity, score: number): string[] {
    const badges: string[] = [];

    // N1NJ4持有者徽章（最重要）
    if (identity.nftHolder) {
      badges.push('N1NJ4 Holder');
    }

    // 早期采用者（创建超过30天）
    const daysSinceCreation =
      (Date.now() - identity.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      badges.push('Early Adopter');
    }

    // 活跃开发者（验证3次以上）
    if ((identity.verificationCount || 1) >= 3) {
      badges.push('Active Developer');
    }

    // 可信者（高分）
    if (score >= 80) {
      badges.push('Trusted');
    }

    return badges;
  }

  /**
   * 生成初始徽章
   */
  private generateInitialBadges(hasNFT: boolean): string[] {
    return hasNFT ? ['N1NJ4 Holder'] : [];
  }

  /**
   * 计算初始分数
   */
  private calculateInitialScore(hasNFT: boolean): number {
    // NFT持有者起始分数高
    return hasNFT ? 70 : 50;
  }
}
