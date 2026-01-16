/**
 * Check current activity tracker data in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkActivityData() {
  console.log('📊 Checking Activity Tracker Data\n');

  const mongoUri = process.env.MONGO_URI || '';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  const { ActivityTracker } = await import('../src/models/ActivityTracker');

  const trackers = await ActivityTracker.find({});
  
  console.log(`Found ${trackers.length} activity tracker(s)\n`);

  for (const tracker of trackers) {
    console.log('='.repeat(60));
    console.log(`User ID: ${tracker.userId}`);
    console.log(`Updated At: ${tracker.updatedAt}`);
    console.log(`\nAggregated Counts:`);
    console.log(`  Growth:      ${tracker.counts.growth}`);
    console.log(`  Health:      ${tracker.counts.health}`);
    console.log(`  Work:        ${tracker.counts.work}`);
    console.log(`  Consumption: ${tracker.counts.consumption}`);
    console.log(`  Other:       ${tracker.counts.other}`);
    
    console.log(`\nRecent Logs (${tracker.recentLogs.length}):`);
    for (const log of tracker.recentLogs) {
      console.log(`\n  📝 Log: ${log.title || 'Untitled'}`);
      console.log(`     Timestamp: ${log.timestamp}`);
      console.log(`     Log ID: ${log.logId}`);
      
      if (log.extractedActivities && log.extractedActivities.length > 0) {
        console.log(`     Extracted Activities (${log.extractedActivities.length}):`);
        log.extractedActivities.forEach((a, i) => {
          console.log(`       ${i + 1}. ${a.activity} ${a.context ? `(${a.context})` : ''}`);
        });
      }
      
      if (log.classificationDetails && log.classificationDetails.length > 0) {
        console.log(`     Classification Details (${log.classificationDetails.length}):`);
        log.classificationDetails.forEach((d, i) => {
          console.log(`       ${i + 1}. [${d.points > 0 ? '+' : ''}${d.points} ${d.category}] ${d.reasoning}`);
        });
      }
      
      if (log.categoryPoints) {
        console.log(`     Category Points: G:${log.categoryPoints.growth} H:${log.categoryPoints.health} W:${log.categoryPoints.work} C:${log.categoryPoints.consumption} O:${log.categoryPoints.other}`);
      }
      
      // Check for old 'activities' field (from previous schema)
      if ((log as any).activities) {
        console.log(`     ⚠️  OLD SCHEMA: Has 'activities' field with ${(log as any).activities.length} items`);
      }
    }
    
    if (tracker.lastReview) {
      console.log(`\nLast Review: ${tracker.lastReview.substring(0, 150)}...`);
      console.log(`Review Generated At: ${tracker.lastReviewAt}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n\nDisconnected from MongoDB');
}

checkActivityData().catch(console.error);
