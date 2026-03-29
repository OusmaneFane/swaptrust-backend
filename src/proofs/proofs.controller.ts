import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProofsService } from './proofs.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Proofs')
@Controller('proofs')
@ApiBearerAuth('access-token')
export class ProofsController {
  constructor(private readonly proofs: ProofsService) {}

  @Get(':filename')
  @ApiOperation({
    summary: 'Afficher une preuve (reçu) si vous êtes client, opérateur ou admin sur la transaction',
  })
  @ApiParam({ name: 'filename', example: '3d87bc0c-552f-4e02-8267-4c740c07efe6.jpg' })
  @Header('Cache-Control', 'private, max-age=3600')
  async getProof(
    @CurrentUser() user: Express.User,
    @Param('filename') filename: string,
  ): Promise<StreamableFile> {
    const { fullPath, ext } = await this.proofs.assertCanViewProof(user, filename);
    const stream = this.proofs.getFileStream(fullPath);
    const type = this.proofs.contentTypeForExt(ext);
    return new StreamableFile(stream, {
      type,
      disposition: `inline; filename="${encodeURIComponent(filename)}"`,
    });
  }
}
