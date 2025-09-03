// Enhanced Program Data Service
// Inspired by CSESoc handbook scraper approach for future dynamic data integration

import { UNSW_PROGRAMS } from './unswPrograms';
import type { Program } from './unswPrograms';
import { UNSW_MAJORS } from './unswMajors';
import type { Major } from './unswMajors';

export interface ProgramSearchResult {
  programs: Program[];
  majors: Major[];
  total: number;
}

export interface EnhancedProgram extends Program {
  code?: string;
  duration?: string;
  faculty: string;
  description?: string;
  prerequisites?: string[];
  careerOutlooks?: string[];
}

export class ProgramDataService {
  private static instance: ProgramDataService;
  private programCache: Map<string, EnhancedProgram[]> = new Map();
  private lastUpdateTime: number = 0;

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): ProgramDataService {
    if (!ProgramDataService.instance) {
      ProgramDataService.instance = new ProgramDataService();
    }
    return ProgramDataService.instance;
  }

  private initializeData() {
    // For now, use our static data with enhanced information
    // This can be replaced with API calls to CSESoc scraper or UNSW APIs
    this.lastUpdateTime = Date.now();
    
    // Check for stale data and refresh if needed (non-blocking)
    if (this.isDataStale()) {
      this.updateFromExternalSource().catch(console.warn);
    }
  }

  // Enhanced search with better relevance scoring
  public searchPrograms(query: string, limit: number = 50): Program[] {
    if (!query.trim()) return UNSW_PROGRAMS.slice(0, limit);

    const searchTerm = query.toLowerCase().trim();
    const results: Array<{ program: Program; relevance: number }> = [];

    UNSW_PROGRAMS.forEach(program => {
      let relevance = 0;
      const labelLower = program.label.toLowerCase();
      const valueLower = program.value.toLowerCase();
      const facultyLower = program.faculty?.toLowerCase() || '';

      // Exact match gets highest score
      if (labelLower === searchTerm || valueLower === searchTerm) {
        relevance = 100;
      }
      // Starts with search term gets high score
      else if (labelLower.startsWith(searchTerm) || valueLower.startsWith(searchTerm)) {
        relevance = 80;
      }
      // Contains all words gets good score
      else if (this.containsAllWords(labelLower, searchTerm)) {
        relevance = 60;
      }
      // Contains search term gets medium score
      else if (labelLower.includes(searchTerm) || valueLower.includes(searchTerm) || facultyLower.includes(searchTerm)) {
        relevance = 40;
      }
      // Fuzzy match gets low score
      else if (this.fuzzyMatch(labelLower, searchTerm)) {
        relevance = 20;
      }

      if (relevance > 0) {
        results.push({ program, relevance });
      }
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(result => result.program);
  }

  // Enhanced search for majors
  public searchMajors(query: string, limit: number = 50): Major[] {
    if (!query.trim()) return UNSW_MAJORS.slice(0, limit);

    const searchTerm = query.toLowerCase().trim();
    const results: Array<{ major: Major; relevance: number }> = [];

    UNSW_MAJORS.forEach(major => {
      let relevance = 0;
      const labelLower = major.label.toLowerCase();
      const valueLower = major.value.toLowerCase();
      const facultyLower = major.faculty?.toLowerCase() || '';

      // Exact match gets highest score
      if (labelLower === searchTerm || valueLower === searchTerm) {
        relevance = 100;
      }
      // Starts with search term gets high score
      else if (labelLower.startsWith(searchTerm) || valueLower.startsWith(searchTerm)) {
        relevance = 80;
      }
      // Contains all words gets good score
      else if (this.containsAllWords(labelLower, searchTerm)) {
        relevance = 60;
      }
      // Contains search term gets medium score
      else if (labelLower.includes(searchTerm) || valueLower.includes(searchTerm) || facultyLower.includes(searchTerm)) {
        relevance = 40;
      }
      // Fuzzy match gets low score
      else if (this.fuzzyMatch(labelLower, searchTerm)) {
        relevance = 20;
      }

      if (relevance > 0) {
        results.push({ major, relevance });
      }
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(result => result.major);
  }

  // Get programs by faculty
  public getProgramsByFaculty(faculty: string): Program[] {
    return UNSW_PROGRAMS.filter(program => 
      program.faculty?.toLowerCase() === faculty.toLowerCase()
    );
  }

  // Get popular programs (based on common searches)
  public getPopularPrograms(): Program[] {
    const popularProgramCodes = [
      'BE_COMP', 'BE_SOFT', 'BSCS', 'BCOM', 'BE_ELEC', 'BE_MECH', 
      'BSC', 'BA', 'BCOM_ACCT', 'BE_CIVIL', 'BSCS_AI', 'MBA',
      'BSCS_GAME', 'BSCS_SEC', 'BE_BIOMED', 'BCOM_FIN'
    ];
    
    return popularProgramCodes
      .map(code => UNSW_PROGRAMS.find(p => p.value === code))
      .filter(Boolean) as Program[];
  }

  // Get popular majors (based on common choices)
  public getPopularMajors(): Major[] {
    const popularMajorCodes = [
      'SE', 'AI', 'CS', 'COMP_ENG', 'ACCT', 'FIN', 'MKT', 'MGMT',
      'MATH', 'STATS', 'PSYC', 'BIO', 'CHEM', 'PHYS', 'DATA_SCI'
    ];
    
    return popularMajorCodes
      .map(code => UNSW_MAJORS.find(m => m.value === code))
      .filter(Boolean) as Major[];
  }

  // Helper method to check if text contains all words
  private containsAllWords(text: string, searchTerm: string): boolean {
    const words = searchTerm.split(' ').filter(word => word.length > 2);
    return words.every(word => text.includes(word));
  }

  // Simple fuzzy matching
  private fuzzyMatch(text: string, searchTerm: string): boolean {
    if (searchTerm.length < 3) return false;
    
    // Remove common words and check if remaining characters match loosely
    const commonWords = ['bachelor', 'master', 'doctor', 'of', 'in', 'and', 'the'];
    const cleanText = text.split(' ').filter(word => !commonWords.includes(word)).join('');
    const cleanSearch = searchTerm.split(' ').filter(word => !commonWords.includes(word)).join('');
    
    if (cleanSearch.length < 3) return false;
    
    // Simple character matching
    const textChars = cleanText.replace(/[^a-z]/g, '');
    const searchChars = cleanSearch.replace(/[^a-z]/g, '');
    
    let matchCount = 0;
    for (const char of searchChars) {
      if (textChars.includes(char)) matchCount++;
    }
    
    return matchCount / searchChars.length > 0.7;
  }

  // Integration with CSESoc GraphQL API for course data
  public async fetchCoursesFromCSESoc(query: string = ''): Promise<any[]> {
    try {
      const graphqlQuery = {
        query: `
          query GetCourses($searchTerm: String!) {
            courses(
              limit: 20
              where: {
                _or: [
                  { course_code: { _ilike: $searchTerm } }
                  { course_name: { _ilike: $searchTerm } }
                ]
                career: { _eq: "Undergraduate" }
              }
            ) {
              course_code
              course_name
              faculty
              career
            }
          }
        `,
        variables: {
          searchTerm: `%${query}%`
        }
      };

      const response = await fetch('https://graphql.csesoc.app/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
      });

      const data = await response.json();
      return data?.data?.courses || [];
    } catch (error) {
      console.warn('Failed to fetch courses from CSESoc API:', error);
      return [];
    }
  }

  // Enhanced method for integrating with CSESoc API
  public async updateFromExternalSource(): Promise<void> {
    try {
      const lastUpdate = localStorage.getItem('programDataLastUpdate');
      const now = Date.now();
      
      // Check if data is older than 24 hours
      if (!lastUpdate || now - parseInt(lastUpdate) > 24 * 60 * 60 * 1000) {
        console.log('Refreshing course data from CSESoc API');
        
        // Cache some popular courses for faster access
        const popularCourses = await this.fetchCoursesFromCSESoc('');
        if (popularCourses.length > 0) {
          localStorage.setItem('csesocCourseCache', JSON.stringify(popularCourses));
        }
        
        localStorage.setItem('programDataLastUpdate', now.toString());
        this.lastUpdateTime = now;
      }
    } catch (error) {
      console.warn('Failed to update data from CSESoc API:', error);
    }
  }

  // Method to check data freshness
  public isDataStale(): boolean {
    const lastUpdate = localStorage.getItem('programDataLastUpdate');
    if (!lastUpdate) return true;
    
    const now = Date.now();
    return now - parseInt(lastUpdate) > 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get cached CSESoc course data
  public getCachedCourses(): any[] {
    try {
      const cached = localStorage.getItem('csesocCourseCache');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      return [];
    }
  }

  // Enhanced search that includes CSESoc course data
  public async searchWithCSESocData(query: string, type: 'programs' | 'majors' = 'programs'): Promise<any[]> {
    const staticResults = type === 'programs' 
      ? this.searchPrograms(query, 10)
      : this.searchMajors(query, 10);

    // For programs, also search CSESoc course data as supplementary
    if (type === 'programs' && query.trim()) {
      try {
        const courseResults = await this.fetchCoursesFromCSESoc(query);
        const mappedCourseResults = courseResults.map(course => ({
          value: course.course_code,
          label: `${course.course_code} - ${course.course_name}`,
          faculty: course.faculty,
          type: 'course'
        }));
        
        // Combine static programs with relevant courses
        return [...staticResults, ...mappedCourseResults.slice(0, 5)];
      } catch (error) {
        console.warn('Failed to fetch supplementary course data:', error);
      }
    }

    return staticResults;
  }

  // Get faculties list
  public getFaculties(): string[] {
    const faculties = new Set<string>();
    UNSW_PROGRAMS.forEach(program => {
      if (program.faculty) faculties.add(program.faculty);
    });
    UNSW_MAJORS.forEach(major => {
      if (major.faculty) faculties.add(major.faculty);
    });
    return Array.from(faculties).sort();
  }
}

// Export singleton instance
export const programDataService = ProgramDataService.getInstance();