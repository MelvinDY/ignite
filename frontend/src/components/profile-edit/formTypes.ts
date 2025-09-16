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
  skills: Skill[];
}

export interface EditProfileFormProps {
  formData: FormData;
  changeFormData: (field: string, value: any) => void;
}
