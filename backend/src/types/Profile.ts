export interface ProfileObject {
  id: string;
  fullName: string;
  handle: string | null;
  photoUrl: string | null;
  isIndonesian: boolean;
  program: string | null;
  major: string | null;
  level: 'foundation' | 'diploma' | 'undergrad' | 'postgrad' | 'phd';
  yearStart: number;
  yearGrad: number | null;
  zid: string;
  headline: string | null;
  domicileCity: string | null;
  domicileCountry: string | null;
  bio: string | null;
  socialLinks: any;
  createdAt: string;
  updatedAt: string;
}
