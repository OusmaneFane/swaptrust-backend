import { CountryResidence, KycStatus, UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      role: UserRole;
      isBanned: boolean;
      kycStatus: KycStatus;
      countryResidence: CountryResidence;
    }
  }
}

export {};
