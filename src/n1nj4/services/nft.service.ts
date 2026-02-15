import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { NFTStatusDto } from '../dtos/n1nj4.dto';

const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
];

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private readonly rpcUrl: string;
  private readonly nftContractAddress: string;

  constructor() {
    this.rpcUrl = process.env.INJECTIVE_RPC_URL || '';
    this.nftContractAddress = process.env.NFT_CONTRACT_ADDRESS || '';

    if (!this.rpcUrl) {
      this.logger.warn('INJECTIVE_RPC_URL not set, NFT checks will fail');
    }
    if (!this.nftContractAddress) {
      this.logger.warn('NFT_CONTRACT_ADDRESS not set, NFT checks will fail');
    }
  }

  /**
   * 检查钱包是否持有N1NJ4 NFT
   * 这个逻辑来自SoulLink项目
   */
  async checkN1NJ4Ownership(walletAddress: string): Promise<NFTStatusDto> {
    try {
      this.logger.log(
        `Checking N1NJ4 NFT ownership for wallet: ${walletAddress}`,
      );

      const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      const contract = new ethers.Contract(
        this.nftContractAddress,
        ERC721_ABI,
        provider,
      );

      // 检查该地址持有的NFT数量
      const balance = await contract.balanceOf(walletAddress);

      if (balance.gt(0)) {
        // 有NFT，获取第一个NFT的Token ID
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, 0);

        this.logger.log(
          `✅ N1NJ4 NFT detected! Token ID: ${tokenId.toString()}`,
        );

        return {
          hasN1NJ4: true,
          tokenId: tokenId.toString(),
          tier: 'Origin', // 默认等级
          acquiredAt: Date.now(),
        };
      }

      this.logger.log('❌ No N1NJ4 NFT found for this wallet');
      return {
        hasN1NJ4: false,
        tokenId: null,
        tier: null,
      };
    } catch (error) {
      this.logger.error(`NFT check failed: ${error.message}`, error.stack);
      
      // 如果是配置问题，返回失败状态
      if (!this.rpcUrl || !this.nftContractAddress) {
        throw new Error(
          'NFT verification not configured. Please set INJECTIVE_RPC_URL and NFT_CONTRACT_ADDRESS',
        );
      }

      // 网络错误，返回未知状态
      return {
        hasN1NJ4: false,
        tokenId: null,
        tier: null,
      };
    }
  }

  /**
   * 批量检查多个钱包的NFT状态
   */
  async batchCheckN1NJ4Ownership(
    walletAddresses: string[],
  ): Promise<Map<string, NFTStatusDto>> {
    const results = new Map<string, NFTStatusDto>();

    // 并行检查所有钱包
    await Promise.all(
      walletAddresses.map(async (address) => {
        try {
          const status = await this.checkN1NJ4Ownership(address);
          results.set(address.toLowerCase(), status);
        } catch (error) {
          this.logger.error(
            `Failed to check NFT for ${address}: ${error.message}`,
          );
          results.set(address.toLowerCase(), {
            hasN1NJ4: false,
            tokenId: null,
            tier: null,
          });
        }
      }),
    );

    return results;
  }
}
