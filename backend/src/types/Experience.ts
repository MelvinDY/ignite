export type ExperienceObject = {
  id: string;
  title: string;
  company: string | null;
  fieldOfWork: string | null;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
  employmentType: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  locationType: string | null;
  description: string | null;
};