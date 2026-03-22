import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Post('submit')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        docType: { type: 'string' },
        front: { type: 'string', format: 'binary' },
        back: { type: 'string', format: 'binary' },
        selfie: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 5_242_880 } },
    ),
  )
  @ApiOperation({ summary: 'Soumettre documents KYC' })
  submit(
    @CurrentUser('id') userId: number,
    @Body() dto: SubmitKycDto,
    @UploadedFiles()
    files: {
      front?: Express.Multer.File[];
      back?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    const front = files.front?.[0];
    const back = files.back?.[0];
    const selfie = files.selfie?.[0];
    if (!front || !back || !selfie) throw new BadRequestException('Missing files');
    return this.kyc.submit(userId, dto.docType, { front, back, selfie });
  }

  @Get('status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Statut KYC' })
  status(@CurrentUser('id') userId: number) {
    return this.kyc.status(userId);
  }

  @Put('admin/:id/approve')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Approuver KYC' })
  approve(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) id: number) {
    return this.kyc.approve(adminId, id);
  }

  @Put('admin/:id/reject')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Rejeter KYC' })
  reject(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
  ) {
    if (!note) throw new BadRequestException('note required');
    return this.kyc.reject(adminId, id, note);
  }
}
