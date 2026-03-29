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
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CreateDisputeDto } from '../disputes/dto/create-dispute.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { KycVerifiedGuard } from '../common/guards/kyc-verified.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly tx: TransactionsService,
    private readonly upload: UploadService,
  ) {}

  @Get()
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historique (client)' })
  list(@CurrentUser('id') userId: number, @Query() q: FilterTransactionsDto) {
    return this.tx.listForClient(userId, q);
  }

  @Get(':id')
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail' })
  one(@CurrentUser() user: Express.User, @Param('id', ParseIntPipe) id: number) {
    return this.tx.getOne(id, user.id, user.role);
  }

  @Post(':id/client-send')
  @UseGuards(KycVerifiedGuard)
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
  @ApiOperation({ summary: 'Confirmer envoi client + reçu' })
  clientSend(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const proofUrl = file ? this.upload.saveFile(file, 'proofs') : null;
    return this.tx.clientConfirmSend(id, userId, proofUrl);
  }

  @Post(':id/client-confirm')
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirmer réception → clôture' })
  clientConfirm(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.tx.clientConfirmReceive(id, userId);
  }

  @Post(':id/dispute')
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ouvrir un litige' })
  openDispute(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.tx.openDispute(id, userId, dto);
  }
}
