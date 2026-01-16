import 'dotenv/config';
import mongoose from 'mongoose';
import { AudioProcessingLog } from '../src/audio-processing/AudioProcessingLog.model';
import { summaryService } from '../src/audio-processing/summary.service';

async function testSummaryPipeline() {
    console.log('🚀 Testing Summary Pipeline End-to-End\n');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Create a test user ID
        const testUserId = new mongoose.Types.ObjectId();
        console.log(`📝 Test User ID: ${testUserId}\n`);

        // Create test audio logs with sample transcripts
        const testLogs = [
            {
                userId: testUserId,
                transcript: 'Today I spent 2 hours coding a new feature in React. Fixed some bugs in the API and deployed to staging.',
                timestamp: new Date(),
                audioUrl: 'https://example.com/audio1.mp3',
                duration: 60,
                status: 'success' as const,
            },
            {
                userId: testUserId,
                transcript: 'Attended a team meeting about the new project roadmap. Sent emails to clients and reviewed pull requests.',
                timestamp: new Date(),
                audioUrl: 'https://example.com/audio2.mp3',
                duration: 45,
                status: 'success' as const,
            },
            {
                userId: testUserId,
                transcript: 'Watched some YouTube tutorials about TypeScript advanced patterns. Read documentation on MongoDB aggregation.',
                timestamp: new Date(),
                audioUrl: 'https://example.com/audio3.mp3',
                duration: 30,
                status: 'success' as const,
            },
        ];

        console.log('[1/4] Creating test audio logs...');
        const createdLogs = await AudioProcessingLog.insertMany(testLogs);
        console.log(`✅ Created ${createdLogs.length} test logs\n`);

        // Get logs for the week
        console.log('[2/4] Fetching logs for current week...');
        const weekStart = getWeekStart(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekLogs = await AudioProcessingLog.find({
            userId: testUserId,
            timestamp: { $gte: weekStart, $lt: weekEnd },
        });
        console.log(`✅ Found ${weekLogs.length} logs for this week\n`);

        // Generate summary
        console.log('[3/4] Generating weekly summary...');
        const result = await summaryService.generateWeeklySummary(
            testUserId.toString(),
            weekLogs,
            weekStart
        );

        console.log('✅ Summary generated!\n');
        console.log('═══════════════════════════════════════');
        console.log('📊 SUMMARY RESULT');
        console.log('═══════════════════════════════════════');
        console.log(`Phase: ${result.phase}`);
        console.log(`\nCategory Hours:`);
        console.log(`  📦 Creation: ${result.categoryHours.creation}h`);
        console.log(`  📱 Consumption: ${result.categoryHours.consumption}h`);
        console.log(`  📚 Learning: ${result.categoryHours.learning}h`);
        console.log(`  💼 Productivity: ${result.categoryHours.productivity}h`);
        console.log(`\n📰 Headline: ${result.story.headline}`);
        console.log(`📝 Narrative: ${result.story.text}`);
        console.log(`🔊 TTS URL: ${result.ttsUrl || 'Not generated'}`);
        console.log('═══════════════════════════════════════\n');

        // Verify TTS URL is accessible if generated
        if (result.ttsUrl) {
            console.log('[4/4] Verifying TTS URL accessibility...');
            const response = await fetch(result.ttsUrl, { method: 'HEAD' });
            console.log(`✅ TTS URL accessible: ${response.status === 200 ? 'Yes' : 'No'}\n`);
        } else {
            console.log('[4/4] TTS not generated (API key missing or rate limited)\n');
        }

        // Cleanup test data
        console.log('🧹 Cleaning up test data...');
        await AudioProcessingLog.deleteMany({ userId: testUserId });
        await mongoose.connection.collection('summaries').deleteMany({ userId: testUserId });
        console.log('✅ Test data cleaned up\n');

        console.log('🎉 PIPELINE TEST COMPLETE!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

testSummaryPipeline();
