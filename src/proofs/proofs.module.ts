import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { ProofsService } from './proofs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProofsController],
  providers: [ProofsService],
})
export class ProofsModule {}
