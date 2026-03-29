import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
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
import { UserRole } from '@prisma/client';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Post('transactions/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ouvrir un litige' })
  open(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputes.open(id, userId, dto);
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Litiges ouverts' })
  adminList() {
    return this.disputes.listAdmin();
  }

  @Put('admin/:id/resolve')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Résoudre' })
  resolve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('resolution') resolution: string,
  ) {
    if (!resolution) throw new BadRequestException('resolution required');
    return this.disputes.resolve(adminId, id, resolution);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail litige' })
  one(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.disputes.getOne(id, userId, role);
  }

  @Post(':id/respond')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Répondre au litige' })
  respond(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('message') message: string,
  ) {
    if (!message) throw new BadRequestException('message required');
    return this.disputes.respond(id, userId, message);
  }

  @Post(':id/attachments')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5_242_880 } }),
  )
  @ApiOperation({ summary: 'Ajouter une pièce jointe' })
  attachment(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file required');
    return this.disputes.addAttachment(id, userId, file);
  }
}
