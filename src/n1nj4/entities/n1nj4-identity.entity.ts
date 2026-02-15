import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('n1nj4_identities')
export class N1NJ4Identity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  credentialId: string; // WebAuthn凭证ID

  @Column({ type: 'varchar' })
  @Index()
  walletAddress: string; // Injective钱包地址 (inj1...)

  @Column({ type: 'varchar', nullable: true })
  nftTokenId: string | null; // N1NJ4 NFT Token ID

  @Column({ type: 'boolean', default: false })
  nftHolder: boolean; // 是否持有N1NJ4 NFT

  @Column({ type: 'varchar', nullable: true })
  nftTier: string | null; // NFT等级: "Origin", "Premium" 等

  @Column({ type: 'int', default: 50 })
  reputationScore: number; // 信誉分 (0-100)

  @Column({ type: 'boolean', default: true })
  isVerified: boolean;

  @Column({ type: 'int', default: 1 })
  verificationCount: number; // 验证次数

  @Column({ type: 'simple-array', nullable: true })
  badges: string[]; // 徽章列表

  @Column({ type: 'varchar', nullable: true })
  tier: string; // 信誉等级: "Bronze", "Silver", "Gold", "Platinum"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastNftCheck: Date; // 上次检查NFT的时间
}
