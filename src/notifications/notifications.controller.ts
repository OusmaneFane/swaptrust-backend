import { Controller, Get, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mes notifications' })
  list(@CurrentUser('id') userId: number) {
    return this.notifications.list(userId);
  }

  @Put('read-all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  readAll(@CurrentUser('id') userId: number) {
    return this.notifications.markAllRead(userId);
  }

  @Get('preferences')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Préférences' })
  prefsGet(@CurrentUser('id') userId: number) {
    return this.notifications.getPreferences(userId);
  }

  @Put('preferences')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier préférences' })
  prefsPut(@CurrentUser('id') userId: number, @Body() dto: UpdatePreferencesDto) {
    return this.notifications.updatePreferences(userId, dto);
  }

  @Put(':id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  readOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notifications.markRead(userId, id);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une notification' })
  remove(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.remove(userId, id);
  }
}
