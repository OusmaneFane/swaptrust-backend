import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/assign-role.dto';
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

  @Put('users/:id/role')
  @ApiOperation({ summary: '[Admin] Assigner un rôle' })
  assignRole(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignRoleDto) {
    return this.admin.assignRole(id, dto.role);
  }

  @Get('operators')
  @ApiOperation({ summary: '[Admin] Lister les opérateurs' })
  listOperators() {
    return this.admin.listOperators();
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Demandes non prises en charge' })
  requestsPending() {
    return this.admin.listPendingRequests();
  }

  @Get('requests')
  @ApiOperation({ summary: 'Toutes les demandes' })
  requestsAll() {
    return this.admin.listAllRequests();
  }

  @Delete('operators/:id')
  @ApiOperation({ summary: '[Admin] Révoquer le rôle opérateur' })
  revokeOperator(@Param('id', ParseIntPipe) id: number) {
    return this.admin.assignRole(id, UserRole.CLIENT);
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
