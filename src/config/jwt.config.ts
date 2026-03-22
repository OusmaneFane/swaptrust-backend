import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me_min_32_characters',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me_min_32_chars',
  accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
}));
