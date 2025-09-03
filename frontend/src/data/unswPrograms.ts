// UNSW Program List - Based on official UNSW degree offerings
// Source: https://www.unsw.edu.au/study/find-a-degree-or-course/degree-search-results

export interface Program {
  value: string;
  label: string;
  faculty?: string;
}

export const UNSW_PROGRAMS: Program[] = [
  // Engineering Faculty
  { value: '3707', label: 'Bachelor of Engineering (Honours)', faculty: 'Engineering' },
  { value: '3707-AERO', label: 'Bachelor of Engineering (Honours) (Aeronautical)', faculty: 'Engineering' },
  { value: '3707-BIOMED', label: 'Bachelor of Engineering (Honours) (Biomedical)', faculty: 'Engineering' },
  { value: '3707-CHEM', label: 'Bachelor of Engineering (Honours) (Chemical)', faculty: 'Engineering' },
  { value: '3707-CIVIL', label: 'Bachelor of Engineering (Honours) (Civil)', faculty: 'Engineering' },
  { value: '3707-COMP', label: 'Bachelor of Engineering (Honours) (Computer)', faculty: 'Engineering' },
  { value: '3707-ELEC', label: 'Bachelor of Engineering (Honours) (Electrical)', faculty: 'Engineering' },
  { value: '3707-ENV', label: 'Bachelor of Engineering (Honours) (Environmental)', faculty: 'Engineering' },
  { value: '3707-FOOD', label: 'Bachelor of Engineering (Honours) (Food)', faculty: 'Engineering' },
  { value: '3707-MECH', label: 'Bachelor of Engineering (Honours) (Mechanical)', faculty: 'Engineering' },
  { value: '3707-MINING', label: 'Bachelor of Engineering (Honours) (Mining)', faculty: 'Engineering' },
  { value: '3707-PETROL', label: 'Bachelor of Engineering (Honours) (Petroleum)', faculty: 'Engineering' },
  { value: '3707-PHOTO', label: 'Bachelor of Engineering (Honours) (Photovoltaic and Solar Energy)', faculty: 'Engineering' },
  { value: '3707-SOFT', label: 'Bachelor of Engineering (Honours) (Software)', faculty: 'Engineering' },
  { value: '3707-TELECOM', label: 'Bachelor of Engineering (Honours) (Telecommunications)', faculty: 'Engineering' },
  
  // Engineering Double Degrees
  { value: '3764', label: 'Bachelor of Engineering (Honours) / Commerce', faculty: 'Engineering' },
  { value: '3785', label: 'Bachelor of Engineering (Honours) / Computer Science', faculty: 'Engineering' },

  // Business School
  { value: '3502', label: 'Bachelor of Commerce', faculty: 'Business School' },
  { value: '3543', label: 'Bachelor of Economics', faculty: 'Business School' },
  { value: '3586', label: 'Bachelor of Actuarial Studies', faculty: 'Business School' },
  { value: '3979', label: 'Bachelor of Information Systems', faculty: 'Business School' },

  // Science Faculty
  { value: '3970', label: 'Bachelor of Science', faculty: 'Science' },
  { value: '4410', label: 'Bachelor of Science (Advanced)', faculty: 'Science' },
  { value: '3778', label: 'Bachelor of Science (Computer Science)', faculty: 'Science' },
  { value: '3956', label: 'Bachelor of Advanced Mathematics (Honours)', faculty: 'Science' },
  { value: '3962', label: 'Bachelor of Advanced Science (Honours)', faculty: 'Science' },
  { value: '3632', label: 'Bachelor of Psychology (Honours)', faculty: 'Science' },
  { value: '3435', label: 'Bachelor of Psychological Science', faculty: 'Science' },

  // Arts, Design & Architecture Faculty
  { value: '3409', label: 'Bachelor of Arts', faculty: 'Arts, Design & Architecture' },
  { value: '4830', label: 'Bachelor of Fine Arts', faculty: 'Arts, Design & Architecture' },
  { value: '3261', label: 'Bachelor of Architectural Studies', faculty: 'Arts, Design & Architecture' },
  { value: '3256', label: 'Bachelor of Interior Architecture (Honours)', faculty: 'Arts, Design & Architecture' },
  { value: '3341', label: 'Bachelor of Media', faculty: 'Arts, Design & Architecture' },
  { value: '3344', label: 'Bachelor of Media / Arts', faculty: 'Arts, Design & Architecture' },
  { value: '4053', label: 'Bachelor of Arts / Education (Secondary)', faculty: 'Arts, Design & Architecture' },

  // Law & Justice Faculty
  { value: '4701', label: 'Bachelor of Laws', faculty: 'Law & Justice' },
  { value: '4782', label: 'Bachelor of Arts / Law', faculty: 'Law & Justice' },
  { value: '3422', label: 'Bachelor of Criminology and Criminal Justice', faculty: 'Law & Justice' },

  // Medicine & Health Faculty
  { value: '3805', label: 'Bachelor of Medical Studies / Doctor of Medicine', faculty: 'Medicine & Health' },
  { value: '3881', label: 'Bachelor of Public Health', faculty: 'Medicine & Health' },
  { value: '3991', label: 'Bachelor of Medical Science', faculty: 'Medicine & Health' },

  // Built Environment Faculty
  { value: '3332', label: 'Bachelor of Construction Management and Property', faculty: 'Built Environment' },
  { value: '4522', label: 'Bachelor of Construction Management and Property (Honours)', faculty: 'Built Environment' },

  // Additional Popular Programs
  { value: 'BSC_ADMATH', label: 'Bachelor of Science (Advanced Mathematics)', faculty: 'Science' },
  { value: 'BSC_MATH', label: 'Bachelor of Science (Mathematics)', faculty: 'Science' },
  { value: 'BSC_STATS', label: 'Bachelor of Science (Statistics)', faculty: 'Science' },
  { value: 'BSC_PHYS', label: 'Bachelor of Science (Physics)', faculty: 'Science' },
  { value: 'BSC_CHEM', label: 'Bachelor of Science (Chemistry)', faculty: 'Science' },
  { value: 'BSC_BIO', label: 'Bachelor of Science (Biology)', faculty: 'Science' },
  { value: 'BSC_PSYC', label: 'Bachelor of Science (Psychology)', faculty: 'Science' },
  { value: 'BSC_GEOL', label: 'Bachelor of Science (Geology)', faculty: 'Science' },
  { value: 'BSC_GEOG', label: 'Bachelor of Science (Geography)', faculty: 'Science' },
  { value: 'BSC_ENVS', label: 'Bachelor of Science (Environmental Science)', faculty: 'Science' },
  { value: 'BSC_MATS', label: 'Bachelor of Science (Materials Science)', faculty: 'Science' },

  // Medicine & Health
  { value: 'MBBS', label: 'Bachelor of Medicine & Bachelor of Surgery', faculty: 'Medicine & Health' },
  { value: 'BHEALTH', label: 'Bachelor of Health Sciences', faculty: 'Medicine & Health' },
  { value: 'BEXSC', label: 'Bachelor of Exercise Science', faculty: 'Medicine & Health' },
  { value: 'BNURSING', label: 'Bachelor of Nursing', faculty: 'Medicine & Health' },
  { value: 'BOPTOM', label: 'Bachelor of Optometry', faculty: 'Medicine & Health' },
  { value: 'BPHARM', label: 'Bachelor of Pharmacy', faculty: 'Medicine & Health' },
  { value: 'BPSYC', label: 'Bachelor of Psychology (Honours)', faculty: 'Medicine & Health' },

  // Arts, Design & Architecture
  { value: 'BA', label: 'Bachelor of Arts', faculty: 'Arts, Design & Architecture' },
  { value: 'BARCH', label: 'Bachelor of Architecture', faculty: 'Arts, Design & Architecture' },
  { value: 'BDESIGN', label: 'Bachelor of Design', faculty: 'Arts, Design & Architecture' },
  { value: 'BFINEARTS', label: 'Bachelor of Fine Arts', faculty: 'Arts, Design & Architecture' },
  { value: 'BMEDIA', label: 'Bachelor of Media Arts', faculty: 'Arts, Design & Architecture' },
  { value: 'BMUS', label: 'Bachelor of Music', faculty: 'Arts, Design & Architecture' },
  { value: 'BPLAN', label: 'Bachelor of Planning', faculty: 'Arts, Design & Architecture' },

  // Law & Justice
  { value: 'LLB', label: 'Bachelor of Laws', faculty: 'Law & Justice' },
  { value: 'BCRIM', label: 'Bachelor of Criminal Justice', faculty: 'Law & Justice' },
  { value: 'BINTLAW', label: 'Bachelor of International Studies', faculty: 'Law & Justice' },

  // Double Degrees - Engineering
  { value: 'BE_BCOM', label: 'Bachelor of Engineering / Bachelor of Commerce', faculty: 'Engineering' },
  { value: 'BE_BSC', label: 'Bachelor of Engineering / Bachelor of Science', faculty: 'Engineering' },
  { value: 'BE_BA', label: 'Bachelor of Engineering / Bachelor of Arts', faculty: 'Engineering' },
  { value: 'BE_LLB', label: 'Bachelor of Engineering / Bachelor of Laws', faculty: 'Engineering' },

  // Double Degrees - Computer Science
  { value: 'BSCS_BCOM', label: 'Bachelor of Science (Computer Science) / Bachelor of Commerce', faculty: 'Engineering' },
  { value: 'BSCS_BMATH', label: 'Bachelor of Science (Computer Science) / Bachelor of Science (Mathematics)', faculty: 'Engineering' },
  { value: 'BSCS_BA', label: 'Bachelor of Science (Computer Science) / Bachelor of Arts', faculty: 'Engineering' },
  { value: 'BSCS_LLB', label: 'Bachelor of Science (Computer Science) / Bachelor of Laws', faculty: 'Engineering' },

  // Double Degrees - Commerce
  { value: 'BCOM_LLB', label: 'Bachelor of Commerce / Bachelor of Laws', faculty: 'Business' },
  { value: 'BCOM_BSC', label: 'Bachelor of Commerce / Bachelor of Science', faculty: 'Business' },
  { value: 'BCOM_BA', label: 'Bachelor of Commerce / Bachelor of Arts', faculty: 'Business' },
  { value: 'BCOM_BINTLAW', label: 'Bachelor of Commerce / Bachelor of International Studies', faculty: 'Business' },

  // Postgraduate Programs
  { value: 'MBA', label: 'Master of Business Administration', faculty: 'Business' },
  { value: 'MENG', label: 'Master of Engineering', faculty: 'Engineering' },
  { value: 'MCOMP', label: 'Master of Computing', faculty: 'Engineering' },
  { value: 'MIT', label: 'Master of Information Technology', faculty: 'Engineering' },
  { value: 'MDESIGN', label: 'Master of Design', faculty: 'Arts, Design & Architecture' },
  { value: 'MARCH', label: 'Master of Architecture', faculty: 'Arts, Design & Architecture' },
  { value: 'MSC', label: 'Master of Science', faculty: 'Science' },
  { value: 'MPSYC', label: 'Master of Psychology', faculty: 'Medicine & Health' },
  { value: 'LLM', label: 'Master of Laws', faculty: 'Law & Justice' },
  { value: 'PHD', label: 'Doctor of Philosophy (PhD)', faculty: 'All Faculties' },

  // Foundation & Diploma Programs
  { value: 'FOUND_SCI', label: 'University Foundation Studies (Science)', faculty: 'Foundation' },
  { value: 'FOUND_COMM', label: 'University Foundation Studies (Commerce)', faculty: 'Foundation' },
  { value: 'FOUND_DESIGN', label: 'University Foundation Studies (Design & Architecture)', faculty: 'Foundation' },
  { value: 'DIP_ENG', label: 'Diploma in Engineering', faculty: 'Foundation' },
  { value: 'DIP_SCI', label: 'Diploma in Science', faculty: 'Foundation' },
  { value: 'DIP_COMM', label: 'Diploma in Commerce', faculty: 'Foundation' },
];

// Helper function to get programs by faculty
export function getProgramsByFaculty(faculty: string): Program[] {
  return UNSW_PROGRAMS.filter(program => program.faculty === faculty);
}

// Helper function to search programs
export function searchPrograms(searchTerm: string): Program[] {
  const term = searchTerm.toLowerCase();
  return UNSW_PROGRAMS.filter(program => 
    program.label.toLowerCase().includes(term) ||
    program.value.toLowerCase().includes(term) ||
    (program.faculty && program.faculty.toLowerCase().includes(term))
  );
}