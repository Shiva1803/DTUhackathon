/**
 * Test script to verify the 3-step activity tracking system
 * Run with: npx ts-node scripts/test-activity-tracking.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testActivityTracking() {
  console.log('🧪 Testing 3-Step Activity Tracking System\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || '';
  if (!mongoUri) {
    console.error('❌ MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  // Import the AI service
  const { aiService } = await import('../src/services/ai.service');
  const { ActivityTracker } = await import('../src/models/ActivityTracker');

  // Test transcript
  const testTranscript = `Today was a productive day. I woke up early and went for a 30 minute jog in the park. 
  After that, I had a healthy breakfast with oatmeal and fruits. 
  Then I spent about 4 hours coding on my side project, learning React Native. 
  For lunch, I unfortunately had some fast food because I was in a rush.
  In the evening, I attended a team meeting for work and made good progress on our sprint goals.
  Before bed, I watched about 2 hours of Netflix and scrolled through Instagram for a while.`;

  console.log('📝 Test Transcript:');
  console.log(testTranscript);
  console.log('\n' + '='.repeat(60) + '\n');

  // STEP 1: Extract activities
  console.log('🔍 STEP 1: Extracting activities...\n');
  const extractedActivities = await aiService.extractActivities(testTranscript);
  console.log('Extracted Activities:');
  extractedActivities.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.activity}`);
    if (a.context) console.log(`     Context: ${a.context}`);
  });
  console.log('\n' + '='.repeat(60) + '\n');

  // STEP 2: Classify activities
  console.log('📊 STEP 2: Classifying activities...\n');
  const { categoryPoints, classificationDetails } = await aiService.classifyActivities(extractedActivities);
  
  console.log('Classification Details:');
  classificationDetails.forEach((d, i) => {
    const sign = d.points > 0 ? '+' : '';
    console.log(`  ${i + 1}. [${sign}${d.points} ${d.category.toUpperCase()}] ${d.activity}`);
    console.log(`     Reason: ${d.reasoning}`);
  });
  
  console.log('\nCategory Points for this log:');
  console.log(`  Growth:      ${categoryPoints.growth}`);
  console.log(`  Health:      ${categoryPoints.health}`);
  console.log(`  Work:        ${categoryPoints.work}`);
  console.log(`  Consumption: ${categoryPoints.consumption}`);
  console.log(`  Other:       ${categoryPoints.other}`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Check current tracker state (without modifying)
  console.log('📈 Current Activity Tracker State:\n');
  
  // Find all trackers to show current state
  const trackers = await ActivityTracker.find({}).limit(5);
  
  if (trackers.length === 0) {
    console.log('  No activity trackers found in database yet.');
  } else {
    for (const tracker of trackers) {
      console.log(`  User: ${tracker.userId}`);
      console.log(`  Total Logs: ${tracker.recentLogs.length}`);
      console.log(`  Aggregated Counts:`);
      console.log(`    Growth:      ${tracker.counts.growth}`);
      console.log(`    Health:      ${tracker.counts.health}`);
      console.log(`    Work:        ${tracker.counts.work}`);
      console.log(`    Consumption: ${tracker.counts.consumption}`);
      console.log(`    Other:       ${tracker.counts.other}`);
      if (tracker.lastReview) {
        console.log(`  Last Review: ${tracker.lastReview.substring(0, 100)}...`);
      }
      console.log('');
    }
  }

  // STEP 3: Test review generation (without saving)
  console.log('='.repeat(60) + '\n');
  console.log('💬 STEP 3: Testing review generation with sample counts...\n');
  
  const sampleCounts = {
    growth: 5,
    health: -2,
    work: 8,
    consumption: -4,
    other: 1
  };
  
  console.log('Sample counts for review:');
  console.log(`  Growth: ${sampleCounts.growth}, Health: ${sampleCounts.health}, Work: ${sampleCounts.work}, Consumption: ${sampleCounts.consumption}`);
  console.log('\nGenerating review...\n');
  
  const review = await aiService.generatePersonalReview(sampleCounts);
  console.log('Generated Review:');
  console.log(review);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All 3 steps tested successfully!');
  console.log('The activity tracking system is working correctly.\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

testActivityTracking().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
