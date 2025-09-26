#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const fakeUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'john.smith@example.com',
    fullName: 'John Smith',
    handle: 'johnsmith',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2021,
    yearGrad: 2024,
    headline: 'Software Engineer at Google • Full-stack Developer',
    domicileCity: 'Sydney',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Passionate software engineer with 3 years of experience in building scalable web applications. Love working with React, Node.js, and cloud technologies.',
    majorName: 'Computer Science',
    status: 'ACTIVE'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah.johnson@example.com',
    fullName: 'Sarah Johnson',
    handle: 'sarahjohnson',
    isIndonesian: true,
    level: 'postgrad',
    yearStart: 2020,
    yearGrad: 2024,
    headline: 'Data Scientist at Microsoft • ML Engineer',
    domicileCity: 'Melbourne',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'Data scientist specializing in machine learning and artificial intelligence. Currently working on cutting-edge AI projects at Microsoft.',
    majorName: 'Data Science',
    status: 'ACTIVE'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'mike.chen@example.com',
    fullName: 'Mike Chen',
    handle: 'mikechen',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2022,
    yearGrad: 2025,
    headline: 'Product Manager at Meta • UX Enthusiast',
    domicileCity: 'Brisbane',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Product manager with a passion for creating user-centric digital experiences. Background in design and business strategy.',
    majorName: 'Business Administration',
    status: 'ACTIVE'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'emily.brown@example.com',
    fullName: 'Emily Brown',
    handle: 'emilybrown',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2021,
    yearGrad: 2024,
    headline: 'Frontend Developer at Canva • React Specialist',
    domicileCity: 'Sydney',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Frontend developer who loves creating beautiful and functional user interfaces. Specializing in React, TypeScript, and modern CSS.',
    majorName: 'Software Engineering',
    status: 'ACTIVE'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'david.wilson@example.com',
    fullName: 'David Wilson',
    handle: 'davidwilson',
    isIndonesian: true,
    level: 'postgrad',
    yearStart: 2019,
    yearGrad: 2023,
    headline: 'Security Engineer at Tesla • Cybersecurity Expert',
    domicileCity: 'Perth',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'Cybersecurity professional with expertise in penetration testing, security architecture, and risk assessment. Passionate about protecting digital assets.',
    majorName: 'Cybersecurity',
    status: 'ACTIVE'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'lisa.garcia@example.com',
    fullName: 'Lisa Garcia',
    handle: 'lisagarcia',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2020,
    yearGrad: 2023,
    headline: 'Marketing Manager at Airbnb • Digital Marketing Expert',
    domicileCity: 'Adelaide',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Digital marketing professional with experience in growth hacking, content strategy, and social media marketing. Love data-driven marketing.',
    majorName: 'Marketing',
    status: 'ACTIVE'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'alex.kumar@example.com',
    fullName: 'Alex Kumar',
    handle: 'alexkumar',
    isIndonesian: true,
    level: 'phd',
    yearStart: 2018,
    yearGrad: null,
    headline: 'AI Researcher at Netflix • Deep Learning Expert',
    domicileCity: 'Canberra',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'PhD candidate researching deep learning applications in computer vision. Published multiple papers on neural network architectures.',
    majorName: 'Artificial Intelligence',
    status: 'ACTIVE'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    email: 'maria.rodriguez@example.com',
    fullName: 'Maria Rodriguez',
    handle: 'mariarodriguez',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2021,
    yearGrad: 2024,
    headline: 'UX Designer at Atlassian • Design Systems Expert',
    domicileCity: 'Sydney',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'UX designer passionate about creating accessible and intuitive user experiences. Experienced in design systems, user research, and prototyping.',
    majorName: 'Design',
    status: 'ACTIVE'
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'james.taylor@example.com',
    fullName: 'James Taylor',
    handle: 'jamestaylor',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2022,
    yearGrad: 2025,
    headline: 'DevOps Engineer at Amazon • Cloud Infrastructure',
    domicileCity: 'Melbourne',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'DevOps engineer specializing in AWS cloud infrastructure, Kubernetes, and CI/CD pipelines. Love automating everything!',
    majorName: 'Information Technology',
    status: 'ACTIVE'
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'jessica.lee@example.com',
    fullName: 'Jessica Lee',
    handle: 'jessicalee',
    isIndonesian: true,
    level: 'postgrad',
    yearStart: 2020,
    yearGrad: 2022,
    headline: 'Business Analyst at Commonwealth Bank • Fintech',
    domicileCity: 'Sydney',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'Business analyst with expertise in financial technology and digital transformation. Experienced in agile methodologies and data analysis.',
    majorName: 'Finance',
    status: 'ACTIVE'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'ryan.anderson@example.com',
    fullName: 'Ryan Anderson',
    handle: 'ryananderson',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2021,
    yearGrad: 2024,
    headline: 'Mobile Developer at Uber • iOS & Android',
    domicileCity: 'Brisbane',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Mobile developer with expertise in both iOS and Android platforms. Love creating smooth, performant mobile experiences using Swift and Kotlin.',
    majorName: 'Software Engineering',
    status: 'ACTIVE'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'amanda.white@example.com',
    fullName: 'Amanda White',
    handle: 'amandawhite',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2020,
    yearGrad: 2023,
    headline: 'Consultant at Deloitte • Strategy & Operations',
    domicileCity: 'Melbourne',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Management consultant specializing in digital transformation and process optimization. Experience across various industries.',
    majorName: 'Business Administration',
    status: 'ACTIVE'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'kevin.martinez@example.com',
    fullName: 'Kevin Martinez',
    handle: 'kevinmartinez',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2022,
    yearGrad: 2025,
    headline: 'Backend Developer at Spotify • Microservices Expert',
    domicileCity: 'Perth',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'Backend developer focused on building scalable microservices and distributed systems. Experienced with Java, Python, and Kubernetes.',
    majorName: 'Computer Science',
    status: 'ACTIVE'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    email: 'stephanie.davis@example.com',
    fullName: 'Stephanie Davis',
    handle: 'stephaniedavis',
    isIndonesian: true,
    level: 'postgrad',
    yearStart: 2019,
    yearGrad: 2021,
    headline: 'Project Manager at BHP • Mining Technology',
    domicileCity: 'Adelaide',
    domicileCountry: 'AU',
    citizenshipStatus: 'Citizen',
    bio: 'Project manager with experience in mining technology and industrial automation. PMP certified with strong leadership skills.',
    majorName: 'Mechanical Engineering',
    status: 'ACTIVE'
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    email: 'daniel.thomas@example.com',
    fullName: 'Daniel Thomas',
    handle: 'danielthomas',
    isIndonesian: true,
    level: 'undergrad',
    yearStart: 2021,
    yearGrad: 2024,
    headline: 'Full Stack Developer at Commonwealth Bank • React & Node.js',
    domicileCity: 'Sydney',
    domicileCountry: 'AU',
    citizenshipStatus: 'Permanent Resident',
    bio: 'Full-stack developer with expertise in modern web technologies. Love building end-to-end solutions using React, Node.js, and PostgreSQL.',
    majorName: 'Software Engineering',
    status: 'ACTIVE'
  }
];

const fakeExperiences = [
  {
    profileId: '11111111-1111-1111-1111-111111111111',
    roleTitle: 'Software Engineer',
    companyName: 'Google',
    fieldOfWorkName: 'Software Development',
    startMonth: 6,
    startYear: 2023,
    endMonth: null,
    endYear: null,
    isCurrent: true,
    employmentType: 'full_time',
    locationCity: 'Sydney',
    locationCountry: 'AU',
    locationType: 'on_site',
    description: 'Building scalable web applications using React and Node.js'
  },
  {
    profileId: '22222222-2222-2222-2222-222222222222',
    roleTitle: 'Data Scientist',
    companyName: 'Microsoft',
    fieldOfWorkName: 'Machine Learning',
    startMonth: 3,
    startYear: 2022,
    endMonth: 5,
    endYear: 2024,
    isCurrent: false,
    employmentType: 'full_time',
    locationCity: 'Melbourne',
    locationCountry: 'AU',
    locationType: 'hybrid',
    description: 'Developed machine learning models for customer analytics'
  },
  {
    profileId: '22222222-2222-2222-2222-222222222222',
    roleTitle: 'Senior Data Scientist',
    companyName: 'Meta',
    fieldOfWorkName: 'Machine Learning',
    startMonth: 6,
    startYear: 2024,
    endMonth: null,
    endYear: null,
    isCurrent: true,
    employmentType: 'full_time',
    locationCity: 'Melbourne',
    locationCountry: 'AU',
    locationType: 'remote',
    description: 'Leading data science initiatives for product recommendation systems'
  }
];

async function createFakeData() {
  try {
    console.log('🚀 Starting fake data generation...');

    // First, ensure all required reference data exists
    console.log('📋 Setting up reference data...');

    // Create majors
    const majors = [
      'Computer Science', 'Software Engineering', 'Information Technology', 'Data Science',
      'Cybersecurity', 'Artificial Intelligence', 'Business Administration', 'Marketing',
      'Finance', 'Design', 'Mechanical Engineering'
    ];

    for (const major of majors) {
      const { error } = await supabase
        .from('majors')
        .upsert({ name: major }, { onConflict: 'name' });

      if (error) {
        console.warn(`Warning: Could not create major ${major}:`, error.message);
      }
    }

    // Create companies
    const companies = [
      'Google', 'Microsoft', 'Meta', 'Amazon', 'Tesla', 'Netflix', 'Canva',
      'Atlassian', 'Commonwealth Bank', 'Airbnb', 'Uber', 'Deloitte', 'KPMG', 'BHP', 'Spotify'
    ];

    for (const company of companies) {
      const { error } = await supabase
        .from('companies')
        .upsert({ name: company }, { onConflict: 'name' });

      if (error) {
        console.warn(`Warning: Could not create company ${company}:`, error.message);
      }
    }

    // Create fields of work
    const fieldsOfWork = [
      'Software Development', 'Machine Learning', 'Product Management', 'Digital Marketing',
      'Cybersecurity', 'UX Design', 'DevOps', 'Business Analysis', 'Mobile Development',
      'Consulting', 'Project Management'
    ];

    for (const field of fieldsOfWork) {
      const { error } = await supabase
        .from('fields_of_work')
        .upsert({ name: field }, { onConflict: 'name' });

      if (error) {
        console.warn(`Warning: Could not create field of work ${field}:`, error.message);
      }
    }

    console.log('✅ Reference data setup complete');

    // Get reference data IDs
    const { data: majorsData } = await supabase.from('majors').select('id, name');
    const { data: companiesData } = await supabase.from('companies').select('id, name');
    const { data: fieldsData } = await supabase.from('fields_of_work').select('id, name');

    const majorMap = Object.fromEntries(majorsData?.map(m => [m.name, m.id]) || []);
    const companyMap = Object.fromEntries(companiesData?.map(c => [c.name, c.id]) || []);
    const fieldMap = Object.fromEntries(fieldsData?.map(f => [f.name, f.id]) || []);

    // Create auth users first
    console.log('👤 Creating auth users...');
    for (const user of fakeUsers) {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {},
        user_id: user.id
      });

      if (error && !error.message.includes('already registered')) {
        console.warn(`Warning: Could not create auth user ${user.email}:`, error.message);
      }
    }

    console.log('✅ Auth users created');

    // Create profiles
    console.log('📋 Creating profiles...');
    for (const user of fakeUsers) {
      const majorId = majorMap[user.majorName];

      if (!majorId) {
        console.warn(`Warning: Major ${user.majorName} not found for user ${user.email}`);
        continue;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.fullName,
          handle: user.handle,
          email: user.email,
          is_indonesian: user.isIndonesian,
          level: user.level,
          year_start: user.yearStart,
          year_grad: user.yearGrad,
          headline: user.headline,
          domicile_city: user.domicileCity,
          domicile_country: user.domicileCountry,
          citizenship_status: user.citizenshipStatus,
          bio: user.bio,
          major_id: majorId,
          status: user.status
        }, { onConflict: 'id' });

      if (error) {
        console.error(`Error creating profile for ${user.email}:`, error);
      } else {
        console.log(`✓ Created profile: ${user.fullName}`);
      }
    }

    // Create experiences
    console.log('💼 Creating experiences...');
    for (const exp of fakeExperiences) {
      const companyId = companyMap[exp.companyName];
      const fieldId = fieldMap[exp.fieldOfWorkName];

      if (!companyId || !fieldId) {
        console.warn(`Warning: Missing company (${exp.companyName}) or field (${exp.fieldOfWorkName}) for experience`);
        continue;
      }

      const { error } = await supabase
        .from('experiences')
        .insert({
          profile_id: exp.profileId,
          role_title: exp.roleTitle,
          company_id: companyId,
          field_of_work_id: fieldId,
          start_month: exp.startMonth,
          start_year: exp.startYear,
          end_month: exp.endMonth,
          end_year: exp.endYear,
          is_current: exp.isCurrent,
          employment_type: exp.employmentType,
          location_city: exp.locationCity,
          location_country: exp.locationCountry,
          location_type: exp.locationType,
          description: exp.description
        });

      if (error) {
        console.warn(`Warning: Could not create experience for ${exp.roleTitle} at ${exp.companyName}:`, error.message);
      } else {
        console.log(`✓ Created experience: ${exp.roleTitle} at ${exp.companyName}`);
      }
    }

    console.log('🎉 Fake data generation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${fakeUsers.length} profiles created`);
    console.log(`   - ${fakeExperiences.length} experiences created`);
    console.log(`   - ${majors.length} majors ensured`);
    console.log(`   - ${companies.length} companies ensured`);
    console.log(`   - ${fieldsOfWork.length} fields of work ensured`);

  } catch (error) {
    console.error('❌ Error generating fake data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createFakeData();
}

module.exports = { createFakeData, fakeUsers, fakeExperiences };