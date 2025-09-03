// UNSW Major/Specialization List - Comprehensive list of available majors

export interface Major {
  value: string;
  label: string;
  faculty?: string;
}

export const UNSW_MAJORS: Major[] = [
  // Engineering Majors
  { value: 'AERO', label: 'Aeronautical Engineering', faculty: 'Engineering' },
  { value: 'BIOMED', label: 'Biomedical Engineering', faculty: 'Engineering' },
  { value: 'CHEM_ENG', label: 'Chemical Engineering', faculty: 'Engineering' },
  { value: 'CIVIL', label: 'Civil Engineering', faculty: 'Engineering' },
  { value: 'COMP_ENG', label: 'Computer Engineering', faculty: 'Engineering' },
  { value: 'ELEC', label: 'Electrical Engineering', faculty: 'Engineering' },
  { value: 'ENV_ENG', label: 'Environmental Engineering', faculty: 'Engineering' },
  { value: 'FOOD', label: 'Food Engineering', faculty: 'Engineering' },
  { value: 'MECH', label: 'Mechanical Engineering', faculty: 'Engineering' },
  { value: 'MINING', label: 'Mining Engineering', faculty: 'Engineering' },
  { value: 'PETROL', label: 'Petroleum Engineering', faculty: 'Engineering' },
  { value: 'PHOTO', label: 'Photovoltaic and Solar Energy Engineering', faculty: 'Engineering' },
  { value: 'SE', label: 'Software Engineering', faculty: 'Engineering' },
  { value: 'TELECOM', label: 'Telecommunications Engineering', faculty: 'Engineering' },

  // Computer Science Specializations
  { value: 'CS', label: 'Computer Science', faculty: 'Engineering' },
  { value: 'AI', label: 'Artificial Intelligence', faculty: 'Engineering' },
  { value: 'BIOINF', label: 'Bioinformatics', faculty: 'Engineering' },
  { value: 'DB_SYS', label: 'Database Systems', faculty: 'Engineering' },
  { value: 'ECOM', label: 'eCommerce Systems', faculty: 'Engineering' },
  { value: 'GAMES', label: 'Computer Games', faculty: 'Engineering' },
  { value: 'HCI', label: 'Human Computer Interaction', faculty: 'Engineering' },
  { value: 'SEC_ENG', label: 'Security Engineering', faculty: 'Engineering' },
  { value: 'NET', label: 'Computer Networks', faculty: 'Engineering' },
  { value: 'PROG_LANG', label: 'Programming Languages', faculty: 'Engineering' },
  { value: 'COMP_GRAPHICS', label: 'Computer Graphics', faculty: 'Engineering' },
  { value: 'ROBOTICS', label: 'Robotics', faculty: 'Engineering' },

  // Business/Commerce Majors
  { value: 'ACCT', label: 'Accounting', faculty: 'Business' },
  { value: 'ECON', label: 'Economics', faculty: 'Business' },
  { value: 'FIN', label: 'Finance', faculty: 'Business' },
  { value: 'HRM', label: 'Human Resource Management', faculty: 'Business' },
  { value: 'IS', label: 'Information Systems', faculty: 'Business' },
  { value: 'MGMT', label: 'Management', faculty: 'Business' },
  { value: 'MKT', label: 'Marketing', faculty: 'Business' },
  { value: 'INT_BUS', label: 'International Business', faculty: 'Business' },
  { value: 'RISK_MGMT', label: 'Risk Management', faculty: 'Business' },
  { value: 'BUS_ANALYTICS', label: 'Business Analytics', faculty: 'Business' },
  { value: 'ENTREPRENEURSHIP', label: 'Entrepreneurship', faculty: 'Business' },

  // Science Majors
  { value: 'MATH', label: 'Mathematics', faculty: 'Science' },
  { value: 'STATS', label: 'Statistics', faculty: 'Science' },
  { value: 'PHYS', label: 'Physics', faculty: 'Science' },
  { value: 'CHEM', label: 'Chemistry', faculty: 'Science' },
  { value: 'BIO', label: 'Biology', faculty: 'Science' },
  { value: 'PSYC', label: 'Psychology', faculty: 'Science' },
  { value: 'GEOL', label: 'Geology', faculty: 'Science' },
  { value: 'GEOG', label: 'Geography', faculty: 'Science' },
  { value: 'ENVS', label: 'Environmental Science', faculty: 'Science' },
  { value: 'MATS', label: 'Materials Science', faculty: 'Science' },
  { value: 'NEUROSCI', label: 'Neuroscience', faculty: 'Science' },
  { value: 'MARINE_BIO', label: 'Marine Biology', faculty: 'Science' },
  { value: 'ASTRON', label: 'Astronomy', faculty: 'Science' },
  { value: 'DATA_SCI', label: 'Data Science', faculty: 'Science' },

  // Arts & Humanities
  { value: 'HIST', label: 'History', faculty: 'Arts' },
  { value: 'PHIL', label: 'Philosophy', faculty: 'Arts' },
  { value: 'ENG_LIT', label: 'English Literature', faculty: 'Arts' },
  { value: 'LANG_LING', label: 'Linguistics', faculty: 'Arts' },
  { value: 'POL_SCI', label: 'Political Science', faculty: 'Arts' },
  { value: 'SOC', label: 'Sociology', faculty: 'Arts' },
  { value: 'ANTHRO', label: 'Anthropology', faculty: 'Arts' },
  { value: 'MEDIA_COMM', label: 'Media and Communications', faculty: 'Arts' },
  { value: 'INT_RELATIONS', label: 'International Relations', faculty: 'Arts' },

  // Design & Architecture
  { value: 'ARCH', label: 'Architecture', faculty: 'Arts, Design & Architecture' },
  { value: 'URBAN_PLAN', label: 'Urban Planning', faculty: 'Arts, Design & Architecture' },
  { value: 'IND_DESIGN', label: 'Industrial Design', faculty: 'Arts, Design & Architecture' },
  { value: 'GRAPH_DESIGN', label: 'Graphic Design', faculty: 'Arts, Design & Architecture' },
  { value: 'INTER_DESIGN', label: 'Interior Design', faculty: 'Arts, Design & Architecture' },
  { value: 'LANDSCAPE', label: 'Landscape Architecture', faculty: 'Arts, Design & Architecture' },

  // Medicine & Health
  { value: 'MED', label: 'Medicine', faculty: 'Medicine & Health' },
  { value: 'HEALTH_SCI', label: 'Health Sciences', faculty: 'Medicine & Health' },
  { value: 'EX_SCI', label: 'Exercise Science', faculty: 'Medicine & Health' },
  { value: 'NURSING', label: 'Nursing', faculty: 'Medicine & Health' },
  { value: 'OPTOM', label: 'Optometry', faculty: 'Medicine & Health' },
  { value: 'PHARM', label: 'Pharmacy', faculty: 'Medicine & Health' },
  { value: 'PHYSIO', label: 'Physiotherapy', faculty: 'Medicine & Health' },
  { value: 'OCC_THERAPY', label: 'Occupational Therapy', faculty: 'Medicine & Health' },
  { value: 'PUBLIC_HEALTH', label: 'Public Health', faculty: 'Medicine & Health' },

  // Law & Justice
  { value: 'LAW', label: 'Law', faculty: 'Law & Justice' },
  { value: 'CRIM_JUST', label: 'Criminal Justice', faculty: 'Law & Justice' },
  { value: 'LEGAL_STUDIES', label: 'Legal Studies', faculty: 'Law & Justice' },

  // Other/Interdisciplinary
  { value: 'OTHER', label: 'Other/Interdisciplinary', faculty: 'General' },
  { value: 'UNDECIDED', label: 'Undecided', faculty: 'General' },
];

// Helper function to get majors by faculty
export function getMajorsByFaculty(faculty: string): Major[] {
  return UNSW_MAJORS.filter(major => major.faculty === faculty);
}

// Helper function to search majors
export function searchMajors(searchTerm: string): Major[] {
  const term = searchTerm.toLowerCase();
  return UNSW_MAJORS.filter(major => 
    major.label.toLowerCase().includes(term) ||
    major.value.toLowerCase().includes(term) ||
    (major.faculty && major.faculty.toLowerCase().includes(term))
  );
}