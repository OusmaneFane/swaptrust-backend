import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une demande d’échange' })
  create(@CurrentUser('id') clientId: number, @Body() dto: CreateRequestDto) {
    return this.requests.create(dto, clientId);
  }

  @Get('mine')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mes demandes' })
  mine(@CurrentUser('id') clientId: number) {
    return this.requests.mine(clientId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail d’une demande' })
  one(@CurrentUser() user: Express.User, @Param('id', ParseIntPipe) id: number) {
    return this.requests.getOne(id, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Annuler sa demande (PENDING uniquement)' })
  cancel(@CurrentUser('id') clientId: number, @Param('id', ParseIntPipe) id: number) {
    return this.requests.cancelOwn(clientId, id);
  }
}
