import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs' })
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'Utilisateurs' })
  users(@Query('search') search?: string) {
    return this.admin.users(search);
  }

  @Put('users/:id/ban')
  @ApiOperation({ summary: 'Bannir' })
  ban(@Param('id', ParseIntPipe) id: number) {
    return this.admin.banUser(id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Transactions' })
  transactions() {
    return this.admin.transactions();
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Litiges ouverts' })
  disputes() {
    return this.admin.disputesQueue();
  }

  @Put('disputes/:id/resolve')
  @ApiOperation({ summary: 'Résoudre litige' })
  resolve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('resolution') resolution: string,
  ) {
    if (!resolution) throw new BadRequestException('resolution required');
    return this.admin.resolveDispute(adminId, id, resolution);
  }

  @Get('kyc/pending')
  @ApiOperation({ summary: 'KYC en attente' })
  kycPending() {
    return this.admin.kycPending();
  }
}
