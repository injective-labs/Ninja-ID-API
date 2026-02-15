import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { N1NJ4Controller } from './n1nj4.controller';
import { N1NJ4Service } from './services/n1nj4.service';
import { NFTService } from './services/nft.service';
import { N1NJ4Identity } from './entities/n1nj4-identity.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([N1NJ4Identity]),
    AuthModule, // 导入AuthModule以使用JWT功能
  ],
  controllers: [N1NJ4Controller],
  providers: [N1NJ4Service, NFTService],
  exports: [N1NJ4Service, NFTService], // 导出服务供其他模块使用
})
export class N1NJ4Module {}
