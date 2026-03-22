import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly upload: UploadService,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liste utilisateurs (admin)' })
  list() {
    return this.users.listForAdmin();
  }

  @Put('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier son profil' })
  updateMe(@CurrentUser('id') userId: number, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(userId, dto);
  }

  @Post('me/avatar')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5_242_880 },
    }),
  )
  @ApiOperation({ summary: 'Upload avatar' })
  avatar(@CurrentUser('id') userId: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file required');
    const rel = this.upload.saveFile(file, 'avatars');
    return this.users.setAvatar(userId, rel);
  }

  @Delete('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer son compte' })
  deleteMe(@CurrentUser('id') userId: number) {
    return this.users.deleteMe(userId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Profil public' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.getPublicProfile(id);
  }

  @Get(':id/reviews')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Avis reçus' })
  reviews(@Param('id', ParseIntPipe) id: number) {
    return this.users.getReviewsForUser(id);
  }
}
