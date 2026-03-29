import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OperatorService } from './operator.service';
import { OperatorGuard } from '../common/guards/operator.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilterRequestsDto } from '../requests/dto/filter-requests.dto';
import { FilterTransactionsDto } from '../transactions/dto/filter-transactions.dto';
import { AddOperatorNoteDto } from './dto/add-operator-note.dto';
import { TakeRequestDto } from './dto/take-request.dto';
import { OperatorCancelTransactionDto } from './dto/operator-cancel-transaction.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('Operator')
@Controller('operator')
@UseGuards(OperatorGuard)
@ApiBearerAuth('access-token')
export class OperatorController {
  constructor(
    private readonly operatorService: OperatorService,
    private readonly upload: UploadService,
  ) {}

  @Get('requests')
  @ApiOperation({ summary: 'Demandes PENDING (temps réel)' })
  listRequests(@Query() filters: FilterRequestsDto) {
    return this.operatorService.listPendingRequests(filters);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Détail demande' })
  getRequest(@Param('id', ParseIntPipe) id: number) {
    return this.operatorService.getRequestDetail(id);
  }

  @Post('requests/:id/take')
  @ApiOperation({ summary: 'Prendre en charge — crée la transaction' })
  takeRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @CurrentUser() operator: Express.User,
    @Body() dto: TakeRequestDto,
  ) {
    return this.operatorService.takeRequest(requestId, operator, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Mes transactions' })
  getMyTransactions(
    @CurrentUser('id') operatorId: number,
    @Query() filters: FilterTransactionsDto,
  ) {
    return this.operatorService.getOperatorTransactions(operatorId, filters);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Détail transaction + logs' })
  getTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Express.User,
  ) {
    return this.operatorService.getTransactionDetail(id, user.id, user.role);
  }

  @Post('transactions/:id/verify-client-proof')
  @ApiOperation({ summary: 'Marquer le reçu client comme vérifié' })
  verifyClientProof(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Express.User,
  ) {
    return this.operatorService.verifyClientProof(id, user.id, user.role);
  }

  @Post('transactions/:id/send')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { proof: { type: 'string', format: 'binary' } },
      required: ['proof'],
    },
  })
  @UseInterceptors(
    FileInterceptor('proof', { storage: memoryStorage(), limits: { fileSize: 5_242_880 } }),
  )
  @ApiOperation({ summary: 'Confirmer envoi opérateur + reçu' })
  operatorSend(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Express.User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('proof file required');
    const proofUrl = this.upload.saveFile(file, 'proofs');
    return this.operatorService.confirmOperatorSend(id, user.id, user.role, proofUrl);
  }

  @Post('transactions/:id/note')
  @ApiOperation({ summary: 'Note interne' })
  addNote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Express.User,
    @Body() dto: AddOperatorNoteDto,
  ) {
    return this.operatorService.addNote(id, user.id, dto.note, user.role);
  }

  @Post('transactions/:id/cancel')
  @ApiOperation({ summary: 'Annuler avec motif' })
  cancelTx(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Express.User,
    @Body() dto: OperatorCancelTransactionDto,
  ) {
    return this.operatorService.cancelTransaction(id, user.id, user.role, dto.reason);
  }
}
