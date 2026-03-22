import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('transactions/:id/messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historique messages' })
  messages(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.chat.listMessages(id, userId);
  }

  @Post('transactions/:id/messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Envoyer un message (HTTP)' })
  send(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.saveMessage(id, userId, dto);
  }

  @Put('transactions/:id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer comme lus' })
  read(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.chat.markRead(id, userId);
  }
}
