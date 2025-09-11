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
  skills: string[];
}

export interface EditProfileFormProps {
  formData: FormData;
  changeFormData: (field: string, value: string | boolean | string[]) => void;
}
