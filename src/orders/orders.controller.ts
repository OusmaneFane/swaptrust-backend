import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { MatchingService } from './matching.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { KycVerifiedGuard } from '../common/guards/kyc-verified.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister ordres (filtres)' })
  list(@Query() q: FilterOrdersDto) {
    return this.orders.listActive(q);
  }

  @Get('mine')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mes ordres' })
  mine(@CurrentUser('id') userId: number) {
    return this.orders.mine(userId);
  }

  @Post()
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un ordre' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }

  @Get(':id/matches')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ordres compatibles' })
  matches(@Param('id', ParseIntPipe) id: number) {
    return this.matching.findMatches(id);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail ordre' })
  one(@Param('id', ParseIntPipe) id: number) {
    return this.orders.getOne(id);
  }

  @Put(':id')
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier son ordre' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.orders.updateOwn(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(KycVerifiedGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Annuler son ordre' })
  cancel(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancelOwn(userId, id);
  }
}
