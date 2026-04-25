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
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
import { UploadService } from '../upload/upload.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly tx: TransactionsService,
    private readonly upload: UploadService,
  ) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historique (client)' })
  list(@CurrentUser('id') userId: number, @Query() q: FilterTransactionsDto) {
    return this.tx.listForClient(userId, q);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail' })
  one(@CurrentUser() user: Express.User, @Param('id', ParseIntPipe) id: number) {
    return this.tx.getOne(id, user.id, user.role);
  }

  @Post(':id/client-send')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        proof: { type: 'string', format: 'binary' },
        file: { type: 'string', format: 'binary' },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'proof', maxCount: 1 },
        { name: 'file', maxCount: 1 },
        { name: 'receipt', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 5_242_880 } },
    ),
  )
  @ApiOperation({ summary: 'Confirmer envoi client + reçu' })
  clientSend(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files?: {
      proof?: Express.Multer.File[];
      file?: Express.Multer.File[];
      receipt?: Express.Multer.File[];
    },
  ) {
    const f = files?.proof?.[0] ?? files?.file?.[0] ?? files?.receipt?.[0];
    const proofUrl = f ? this.upload.saveFile(f, 'proofs') : null;
    return this.tx.clientConfirmSend(id, userId, proofUrl);
  }

  @Post(':id/client-confirm')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirmer réception → clôture' })
  clientConfirm(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.tx.clientConfirmReceive(id, userId);
  }

  @Post(':id/dispute')
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
