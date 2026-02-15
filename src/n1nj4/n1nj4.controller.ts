import { Controller, Post, Get, Body, Query, Param, Logger } from '@nestjs/common';
import { N1NJ4Service } from './services/n1nj4.service';
import {
  VerifyN1NJ4Dto,
  VerifyN1NJ4ResponseDto,
  QueryIdentitiesResponseDto,
  ReputationDto,
  DeveloperProfileDto,
} from './dtos/n1nj4.dto';

@Controller('v1/n1nj4')
export class N1NJ4Controller {
  private readonly logger = new Logger(N1NJ4Controller.name);

  constructor(private readonly n1nj4Service: N1NJ4Service) {}

  /**
   * 1️⃣ POST /api/v1/n1nj4/verify
   * 身份验证端点
   * 
   * 功能:
   * - 检查钱包是否持有N1NJ4 NFT
   * - 验证Passkey凭证
   * - 创建或更新身份记录
   * - 返回JWT Token
   */
  @Post('verify')
  async verifyIdentity(
    @Body() dto: VerifyN1NJ4Dto,
  ): Promise<VerifyN1NJ4ResponseDto> {
    this.logger.log(
      `[POST /api/v1/n1nj4/verify] Wallet: ${dto.walletAddress}`,
    );
    const result = await this.n1nj4Service.verifyIdentity(dto);
    this.logger.log(
      `[POST /api/v1/n1nj4/verify] ✅ Success - Identity: ${result.identityId}`,
    );
    return result;
  }

  /**
   * 2️⃣ GET /api/v1/n1nj4/identities?walletAddresses=inj1xxx,inj1yyy
   * 查询身份信息端点
   * 
   * 功能:
   * - 批量查询多个钱包的身份状态
   * - 返回NFT持有情况和信誉分
   */
  @Get('identities')
  async queryIdentities(
    @Query('walletAddresses') walletAddressesQuery: string,
  ): Promise<QueryIdentitiesResponseDto> {
    this.logger.log('[GET /api/v1/n1nj4/identities] Request received');

    // 解析查询参数：将逗号分隔的字符串转换为数组
    const walletAddresses = walletAddressesQuery
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (walletAddresses.length === 0) {
      throw new Error('At least one wallet address is required');
    }

    this.logger.log(
      `[GET /api/v1/n1nj4/identities] Querying ${walletAddresses.length} addresses`,
    );

    const result = await this.n1nj4Service.queryIdentities(walletAddresses);
    
    this.logger.log(
      `[GET /api/v1/n1nj4/identities] ✅ Returned ${result.identities.length} identities`,
    );
    
    return result;
  }

  /**
   * 3️⃣ GET /api/v1/n1nj4/reputation/:credentialId
   * 信誉评分端点
   * 
   * 功能:
   * - 计算开发者的信誉评分
   * - 基于NFT持有、链上活动等因素
   * - 返回评分细分和等级
   */
  @Get('reputation/:credentialId')
  async getReputation(
    @Param('credentialId') credentialId: string,
  ): Promise<ReputationDto> {
    this.logger.log(
      `[GET /api/v1/n1nj4/reputation/:credentialId] Credential: ${credentialId.substring(0, 20)}...`,
    );
    
    const result = await this.n1nj4Service.getReputation(credentialId);
    
    this.logger.log(
      `[GET /api/v1/n1nj4/reputation/:credentialId] ✅ Score: ${result.overallScore}, Tier: ${result.tier}`,
    );
    
    return result;
  }

  /**
   * 4️⃣ GET /api/v1/n1nj4/developer/:credentialId
   * 开发者资料端点
   * 
   * 功能:
   * - 获取开发者的完整身份信息
   * - 包括NFT资料、信誉评分、验证历史
   */
  @Get('developer/:credentialId')
  async getDeveloperProfile(
    @Param('credentialId') credentialId: string,
  ): Promise<DeveloperProfileDto> {
    this.logger.log(
      `[GET /api/v1/n1nj4/developer/:credentialId] Credential: ${credentialId.substring(0, 20)}...`,
    );
    
    const result = await this.n1nj4Service.getDeveloperProfile(credentialId);
    
    this.logger.log(
      `[GET /api/v1/n1nj4/developer/:credentialId] ✅ Profile retrieved`,
    );
    
    return result;
  }
}
