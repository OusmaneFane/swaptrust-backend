import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { LegalService } from './legal.service';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Public()
  @Get('privacy')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Politique de confidentialité (Markdown)' })
  privacy(): string {
    return this.legal.getDocMarkdown('privacy');
  }

  @Public()
  @Get('terms')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Conditions Générales d’Utilisation (Markdown)' })
  terms(): string {
    return this.legal.getDocMarkdown('terms');
  }

  @Public()
  @Get('disclaimer')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiOperation({ summary: 'Disclaimer (Markdown)' })
  disclaimer(): string {
    return this.legal.getDocMarkdown('disclaimer');
  }
}

