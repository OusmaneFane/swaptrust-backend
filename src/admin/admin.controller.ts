import {
  Controller,
  Get,
  Post,
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
import { CreatePlatformAccountDto } from './dto/create-platform-account.dto';
import { UpdatePlatformAccountDto } from './dto/update-platform-account.dto';
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

  @Get('platform-accounts')
  @ApiOperation({ summary: '[Admin] Numéros de réception SwapTrust' })
  listPlatformAccounts() {
    return this.admin.listPlatformAccounts();
  }

  @Post('platform-accounts')
  @ApiOperation({ summary: '[Admin] Ajouter un compte plateforme' })
  addPlatformAccount(@Body() dto: CreatePlatformAccountDto) {
    return this.admin.createPlatformAccount(dto);
  }

  @Put('platform-accounts/:id')
  @ApiOperation({ summary: '[Admin] Modifier un compte plateforme' })
  updatePlatformAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlatformAccountDto,
  ) {
    return this.admin.updatePlatformAccount(id, dto);
  }

  @Delete('platform-accounts/:id')
  @ApiOperation({ summary: '[Admin] Désactiver un compte plateforme' })
  deactivatePlatformAccount(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deactivatePlatformAccount(id);
  }

  @Get('revenue/summary')
  @ApiOperation({
    summary: '[Admin] Synthèse commissions / volumes (CFA, NEED_RUB)',
  })
  revenueSummary(@Query('period') period = 'month') {
    return this.admin.revenueSummary(period);
  }
}
