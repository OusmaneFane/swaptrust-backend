import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { KycVerifiedGuard } from '../common/guards/kyc-verified.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(KycVerifiedGuard)
export class TransactionsController {
  constructor(
    private readonly tx: TransactionsService,
    private readonly upload: UploadService,
  ) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historique' })
  list(@CurrentUser('id') userId: number, @Query() q: FilterTransactionsDto) {
    return this.tx.listForUser(userId, q);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Initier depuis deux ordres' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateTransactionDto) {
    return this.tx.create(userId, dto);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail' })
  one(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.tx.getOne(id, userId);
  }

  @Post(':id/confirm-send')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { proof: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('proof', { storage: memoryStorage(), limits: { fileSize: 5_242_880 } }),
  )
  @ApiOperation({ summary: 'Confirmer envoi + preuve' })
  confirmSend(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let proofUrl: string | null = null;
    if (file) proofUrl = this.upload.saveFile(file, 'proofs');
    return this.tx.confirmSend(userId, id, proofUrl);
  }

  @Post(':id/confirm-receive')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirmer réception' })
  confirmReceive(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.tx.confirmReceive(userId, id);
  }

  @Post(':id/cancel')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Annuler' })
  cancel(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.tx.cancel(userId, id);
  }
}
