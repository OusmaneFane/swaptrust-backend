import { CountryResidence, KycStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      isAdmin: boolean;
      isBanned: boolean;
      kycStatus: KycStatus;
      countryResidence: CountryResidence;
    }
  }
}

export {};
