import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { fromBech32, toHex } from '@cosmjs/encoding';
import { NFTStatusDto } from '../dtos/n1nj4.dto';
import axios from 'axios';

const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
];

// Blockscout API Response Types
interface BlockscoutTransaction {
  hash: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  timestamp: string;
  block_number: number;
  status: 'ok' | 'error';
  gas_used?: string;
  gas_price?: string;
  method?: string;
}

interface BlockscoutResponse {
  items: BlockscoutTransaction[];
  next_page_params?: {
    block_number: number;
    index: number;
    items_count: number;
  };
}

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private readonly rpcUrl: string;
  private readonly nftContractAddress: string;
  private readonly blockscoutApiUrl: string;

  constructor() {
    this.rpcUrl = process.env.INJECTIVE_RPC_URL || '';
    this.nftContractAddress = process.env.NFT_CONTRACT_ADDRESS || '';
    this.blockscoutApiUrl =
      process.env.BLOCKSCOUT_API_URL ||
      'https://testnet.blockscout-api.injective.network';

    if (!this.rpcUrl) {
      this.logger.warn('INJECTIVE_RPC_URL not set, NFT checks will fail');
    }
    if (!this.nftContractAddress) {
      this.logger.warn('NFT_CONTRACT_ADDRESS not set, NFT checks will fail');
    }
  }

  /**
   * 获取 NFT contract 实例（懒加载）
   */
  private getContract(): ethers.Contract {
    const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    return new ethers.Contract(
      this.nftContractAddress,
      ERC721_ABI,
      provider,
    );
  }

  /**
   * 将 Injective 地址 (inj1...) 转换为 EVM 地址 (0x...)
   */
  private injectiveToEvmAddress(injectiveAddress: string): string {
    try {
      // 如果已经是 EVM 地址，直接返回
      if (injectiveAddress.startsWith('0x')) {
        return injectiveAddress;
      }

      // 解码 Bech32 地址
      const { data } = fromBech32(injectiveAddress);
      // 转换为十六进制
      const evmAddress = '0x' + toHex(data);
      
      this.logger.debug(
        `Address conversion: ${injectiveAddress} → ${evmAddress}`,
      );
      
      return evmAddress;
    } catch (error) {
      this.logger.error(`Address conversion failed: ${error.message}`);
      throw new Error(`Invalid Injective address: ${injectiveAddress}`);
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

      // 转换 Injective 地址为 EVM 地址
      const evmAddress = this.injectiveToEvmAddress(walletAddress);
      this.logger.log(`Using EVM address for contract call: ${evmAddress}`);

      const contract = this.getContract();

      // 检查该地址持有的NFT数量
      const balance = await contract.balanceOf(evmAddress);

      if (balance.gt(0)) {
        // 有NFT，获取第一个NFT的Token ID
        const tokenId = await contract.tokenOfOwnerByIndex(evmAddress, 0);

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

  /**
   * 查询地址的历史交易数量（使用 Blockscout API）
   */
  async getTransactionCount(walletAddress: string): Promise<number> {
    try {
      // 转换为 EVM 地址
      const evmAddress = this.injectiveToEvmAddress(walletAddress);
      this.logger.log(
        `Fetching transaction count for ${evmAddress} from Blockscout API`,
      );

      // 调用 Blockscout API
      const url = `${this.blockscoutApiUrl}/api/v2/addresses/${evmAddress}/transactions`;

      const response = await axios.get<BlockscoutResponse>(url, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000, // 10秒超时
      });

      const txCount = response.data.items?.length || 0;
      this.logger.log(
        `✅ Found ${txCount} recent transactions for ${evmAddress}`,
      );

      return txCount;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transaction count: ${error.message}`,
        error.stack,
      );
      // 返回 0 而不是抛出错误，避免影响其他功能
      return 0;
    }
  }

  /**
   * 获取地址的详细交易历史
   */
  async getTransactionHistory(
    walletAddress: string,
    limit: number = 50,
  ): Promise<BlockscoutTransaction[]> {
    try {
      const evmAddress = this.injectiveToEvmAddress(walletAddress);
      const url = `${this.blockscoutApiUrl}/api/v2/addresses/${evmAddress}/transactions`;

      const response = await axios.get<BlockscoutResponse>(url, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      return response.data.items?.slice(0, limit) || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch transaction history: ${error.message}`,
      );
      return [];
    }
  }
}
