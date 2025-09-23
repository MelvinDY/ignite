export type Skill = {
  id: number;
  name: string;
};

export interface FormData {
  emailAddress: string;
  fullName: string;
  zid: string;
  isIndonesian: boolean;
  bio: string;
  headline: string;
  major: string;
  level: string;
  program: string;
  yearStart: number;
  yearGrad: number | null;
  domicileCity: string;
  domicileCountry: string;
}

export interface EditProfileFormProps {
  formData: FormData;
  changeFormData: (field: string, value: any) => void;
}
