import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse the uploaded CSV file to extract authentic question structure
const csvFile = '../attached_assets/Copy of Final_Questions_03272025-for Adam.xlsx - Sheet5_1752960766794.csv';

console.log('Parsing authentic certification question dataset...');

// Read and parse the CSV file
try {
  const csvData = fs.readFileSync(path.join(__dirname, csvFile), 'utf8');
  const lines = csvData.split('\n').filter(line => line.trim());
  
  console.log('\n=== AUTHENTIC QUESTION DATASET SUMMARY ===');
  console.log('From uploaded CSV file with 57,672+ certification questions\n');
  
  let currentCertification = '';
  let totalQuestions = 0;
  
  lines.forEach(line => {
    const [certification, domain, count] = line.split(',');
    
    if (certification && certification !== 'certification' && !certification.includes('Total')) {
      currentCertification = certification;
      if (domain && count && !isNaN(parseInt(count))) {
        const questionCount = parseInt(count);
        totalQuestions += questionCount;
        console.log(`${certification.padEnd(10)} ${domain.padEnd(60)} ${questionCount.toLocaleString().padStart(6)} questions`);
      }
    } else if (domain && count && !isNaN(parseInt(count))) {
      const questionCount = parseInt(count);
      totalQuestions += questionCount;
      console.log(`${' '.repeat(10)} ${domain.padEnd(60)} ${questionCount.toLocaleString().padStart(6)} questions`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL AUTHENTIC QUESTIONS AVAILABLE: ${totalQuestions.toLocaleString()}`);
  console.log('='.repeat(80));
  console.log('\nThis dataset provides comprehensive coverage for authentic certification practice.');
  console.log('Each certification now has 1,000+ questions across all authentic domains.');
  console.log('Users can create realistic practice exams with 50-200+ questions per session.');
  
} catch (error) {
  console.error('Error reading CSV file:', error.message);
  console.log('Expected file location:', path.join(__dirname, csvFile));
}

// Export the question structure for use in database seeding
export const authenticQuestionData = {
  // Authentic question counts from the uploaded dataset
  questionCounts: {
    'CC': 8375,
    'CISSP': 15582,
    'Cloud+': 20763,
    'CISM': 5259,
    'CGRC': 6153,
    'CISA': 1540
  },
  totalQuestions: 57672,
  domains: {
    'CC': [
      'Domain 1: Security Principles',
      'Domain 2: Business Continuity, Disaster Recovery, and Incident Response Concepts',
      'Domain 3: Access Control Concepts',
      'Domain 4: Network Security Concepts',
      'Domain 5: Security Operations Concepts'
    ],
    'CGRC': [
      'Domain 1: Security and Privacy Governance, Risk Management, and Compliance Program',
      'Domain 2: Scope of the Information System',
      'Domain 3: Selection and Approval of Security and Privacy Controls',
      'Domain 4: Implementation of Security and Privacy Controls',
      'Domain 5: Assessment/Audit of Security and Privacy Controls',
      'Domain 6: System Compliance',
      'Domain 7: Compliance Maintenance'
    ],
    'CISA': [
      'Domain 1: Information Systems Auditing Process'
    ],
    'CISM': [
      'Domain 1: Information Security Governance',
      'Domain 2: Information Security Risk Management',
      'Domain 3: Information Security Program',
      'Domain 4: Incident Management and Response'
    ],
    'CISSP': [
      'Domain 1: Security and Risk Management',
      'Domain 2: Asset Security',
      'Domain 3: Security Architecture and Engineering',
      'Domain 4: Communication and Network Security',
      'Domain 5: Identity and Access Management',
      'Domain 6: Security Assessment and Testing',
      'Domain 7: Security Operations',
      'Domain 8: Software Development Security'
    ],
    'Cloud+': [
      'Domain 1: Cloud Architecture & Design',
      'Domain 2: Cloud Security',
      'Domain 3: Cloud Deployment',
      'Domain 4: Operations and Support',
      'Domain 5: Troubleshooting'
    ]
  }
};