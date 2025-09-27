const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Test users configuration
const testUsers = [
  { email: 'ivy@test.com', skipRate: 0 },      // No skipped surveys
  { email: 'skip@test.com', skipRate: 0.3 },   // Skip ~30% of surveys
  { email: 'chad@test.com', skipRate: 0 },     // No skipped surveys
  { email: 'paige@test.com', skipRate: 0.25 } // Skip ~25% of surveys
];

// Survey responses for Q3 (Support & Energy)
const supportResponses = [
  "Feeling supported by my team today",
  "Great collaboration on the project",
  "Team meetings were productive",
  "Received helpful feedback from colleagues",
  "Feeling energized after lunch break",
  "Positive atmosphere in the office",
  "Good communication with management",
  "Feeling motivated to tackle challenges",
  "Supportive work environment",
  "Team spirit is high today",
  "Feeling confident about upcoming tasks",
  "Good work-life balance today",
  "Colleagues are very helpful",
  "Feeling positive about progress",
  "Energy levels are good",
  "Feeling supported by leadership",
  "Team dynamics are excellent",
  "Feeling optimistic about the future",
  "Good support from HR department",
  "Feeling valued by the organization",
  "Some challenges today but manageable",
  "Mixed feelings about workload",
  "Neutral about team interactions",
  "Average energy levels",
  "Some stress but coping well",
  "Feeling somewhat isolated",
  "Workload is getting heavy",
  "Team communication could be better",
  "Feeling drained by end of day",
  "Some conflicts with colleagues",
  "Management support lacking",
  "Feeling overwhelmed with tasks",
  "Energy levels are low",
  "Team morale seems down",
  "Feeling unsupported today",
  "Difficult day overall",
  "Struggling with motivation",
  "Feeling disconnected from team",
  "Work stress is affecting mood",
  "Need more support from management"
];

// Mood options (matching the analytics page expectations)
const moods = ['great', 'okay', 'tired', 'stressed', 'overwhelmed'];

// Concern options (matching the analytics page expectations)
const concerns = [
  'Resident grief or decline',
  'Family conflict', 
  'Workload / understaffing',
  'Supervisor or leadership issues',
  'Personal / outside stress',
  'Other'
];

// Generate random response
function getRandomResponse() {
  return supportResponses[Math.floor(Math.random() * supportResponses.length)];
}

// Generate random mood
function getRandomMood() {
  return moods[Math.floor(Math.random() * moods.length)];
}

// Generate random concern
function getRandomConcern() {
  return concerns[Math.floor(Math.random() * concerns.length)];
}

// Calculate sentiment score based on response
function getSentimentScore(response) {
  const positiveWords = ['supported', 'great', 'productive', 'helpful', 'energized', 'positive', 'good', 'motivated', 'confident', 'excellent', 'optimistic', 'valued'];
  const negativeWords = ['challenges', 'stress', 'isolated', 'heavy', 'drained', 'conflicts', 'lacking', 'overwhelmed', 'low', 'down', 'unsupported', 'difficult', 'struggling', 'disconnected'];
  
  const lowerResponse = response.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerResponse.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerResponse.includes(word)) score -= 1;
  });
  
  return Math.max(-2, Math.min(2, score));
}

// Get user by email
async function getUser(email) {
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    console.log(`User with email ${email} not found`);
    return null;
  }
  return usersSnapshot.docs[0];
}

// Generate date range (45 days back from today)
function getDateRange() {
  const dates = [];
  const today = new Date();
  
  for (let i = 44; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Seed user data
async function seedUser(userEmail, skipRate) {
  console.log(`\nSeeding data for ${userEmail}...`);
  
  const userDoc = await getUser(userEmail);
  if (!userDoc) {
    console.log(`Skipping ${userEmail} - user not found`);
    return;
  }
  
  const userId = userDoc.id;
  const userData = userDoc.data();
  const agencyId = userData.agencyId || 'default-agency';
  
  console.log(`Found user: ${userData.displayName || userData.email} (${userId})`);
  
  const dates = getDateRange();
  const batch = db.batch();
  let surveyCount = 0;
  
  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Determine if this survey should be skipped
    const shouldSkip = Math.random() < skipRate;
    
    if (shouldSkip) {
      console.log(`  Skipping survey for ${dateStr}`);
      continue;
    }
    
    // Generate start shift survey
    const startResponse = getRandomResponse();
    const startMood = getRandomMood();
    const startConcern = getRandomConcern();
    const startSentiment = getSentimentScore(startResponse);
    
    const startSurveyRef = db.collection('surveys').doc();
    batch.set(startSurveyRef, {
      userId: userId,
      agencyId: agencyId,
      userRole: userData.role || 'user',
      surveyType: 'start',
      responses: {
        mood: startMood,
        mainConcern: startConcern,
        support: startResponse,
        sentiment: startSentiment
      },
      completedAt: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      createdAt: new Date()
    });
    
    // Generate end shift survey
    const endResponse = getRandomResponse();
    const endMood = getRandomMood();
    const endConcern = getRandomConcern();
    const endSentiment = getSentimentScore(endResponse);
    
    const endSurveyRef = db.collection('surveys').doc();
    batch.set(endSurveyRef, {
      userId: userId,
      agencyId: agencyId,
      userRole: userData.role || 'user',
      surveyType: 'end',
      responses: {
        mood: endMood,
        mainConcern: endConcern,
        support: endResponse,
        sentiment: endSentiment
      },
      completedAt: new Date(date.getTime() + 17 * 60 * 60 * 1000), // 5 PM
      createdAt: new Date()
    });
    
    // Create survey completion records
    const startCompletionRef = db.collection('surveyCompletions').doc(`${userId}_${dateStr}_start`);
    batch.set(startCompletionRef, {
      userId: userId,
      agencyId: agencyId,
      surveyType: 'start',
      completedAt: new Date(date.getTime() + 8 * 60 * 60 * 1000),
      surveyId: startSurveyRef.id,
      responses: {
        mood: startMood,
        mainConcern: startConcern,
        support: startResponse,
        sentiment: startSentiment
      }
    });
    
    const endCompletionRef = db.collection('surveyCompletions').doc(`${userId}_${dateStr}_end`);
    batch.set(endCompletionRef, {
      userId: userId,
      agencyId: agencyId,
      surveyType: 'end',
      completedAt: new Date(date.getTime() + 17 * 60 * 60 * 1000),
      surveyId: endSurveyRef.id,
      responses: {
        mood: endMood,
        mainConcern: endConcern,
        support: endResponse,
        sentiment: endSentiment
      }
    });
    
    surveyCount += 2;
  }
  
  await batch.commit();
  console.log(`  Created ${surveyCount} surveys for ${userEmail}`);
}

// Main execution
async function main() {
  console.log('Starting test user data seeding...');
  console.log('Users:', testUsers.map(u => `${u.email} (skip rate: ${u.skipRate * 100}%)`).join(', '));
  
  for (const user of testUsers) {
    await seedUser(user.email, user.skipRate);
  }
  
  console.log('\nTest user data seeding completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('Error seeding test user data:', error);
  process.exit(1);
});
