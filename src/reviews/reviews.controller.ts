import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('transactions/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Laisser un avis' })
  create(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.createForTransaction(id, userId, dto);
  }

  @Get('users/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Avis d\'un utilisateur' })
  forUser(@Param('id', ParseIntPipe) id: number) {
    return this.reviews.listForUser(id);
  }
}
