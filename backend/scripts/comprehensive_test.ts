/**
 * Comprehensive Platform Test Suite
 * 
 * Tests ALL features and endpoints of the audio journaling platform.
 * 
 * Usage: npx ts-node scripts/comprehensive_test.ts
 * 
 * Requirements:
 * - Server running with MOCK_AUTH=true
 * - MongoDB connected
 * - At least one test audio file (optional - will create dummy)
 */

import 'dotenv/config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// ==========================================
// Configuration
// ==========================================
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'mock';
const TIMEOUT = 30000;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    },
});

// ==========================================
// Test Result Tracking
// ==========================================
interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    error?: string;
    response?: any;
}

const results: TestResult[] = [];
let testAudioLogId: string | null = null;
let testChatSessionId: string | null = null;

// ==========================================
// Helper Functions
// ==========================================
async function runTest(
    name: string,
    testFn: () => Promise<any>,
    skipCondition?: boolean
): Promise<void> {
    if (skipCondition) {
        results.push({ name, status: 'SKIP', duration: 0 });
        console.log(`⏭️  SKIP: ${name}`);
        return;
    }

    const start = Date.now();
    try {
        const response = await testFn();
        const duration = Date.now() - start;
        results.push({ name, status: 'PASS', duration, response });
        console.log(`✅ PASS: ${name} (${duration}ms)`);
    } catch (error) {
        const duration = Date.now() - start;
        let errorMessage = 'Unknown error';
        let errorDetails: any = null;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            errorMessage = `HTTP ${axiosError.response?.status}: ${JSON.stringify(axiosError.response?.data)}`;
            errorDetails = axiosError.response?.data;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        results.push({ name, status: 'FAIL', duration, error: errorMessage, response: errorDetails });
        console.log(`❌ FAIL: ${name} (${duration}ms)`);
        console.log(`   Error: ${errorMessage}`);
    }
}

function createDummyAudioFile(filename: string): string {
    const filePath = path.join(__dirname, filename);

    // Create a minimal valid WAV file header
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = sampleRate; // 1 second
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;

    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Write silence (zeros already in buffer)
    fs.writeFileSync(filePath, buffer);

    return filePath;
}

function printHeader(title: string): void {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 ${title}`);
    console.log('='.repeat(60) + '\n');
}

function printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60) + '\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const totalTime = results.reduce((acc, r) => acc + r.duration, 0);

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);

    if (failed > 0) {
        console.log('\n--- Failed Tests ---');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  • ${r.name}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60) + '\n');
}

// ==========================================
// Test Suite
// ==========================================
async function runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Platform Tests\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 10)}...`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // ==========================================
    // 1. HEALTH CHECK TESTS
    // ==========================================
    printHeader('1. Health Check Tests');

    await runTest('GET /health - Server Health', async () => {
        const response = await api.get('/health');
        if (response.data.status !== 'ok' && response.data.status !== 'degraded') {
            throw new Error(`Unexpected status: ${response.data.status}`);
        }
        console.log(`   Services: ${JSON.stringify(response.data.services)}`);
        return response.data;
    });

    // ==========================================
    // 2. AUTHENTICATION TESTS
    // ==========================================
    printHeader('2. Authentication Tests');

    await runTest('GET /api/auth/me - Get Current User', async () => {
        const response = await api.get('/api/auth/me');
        if (!response.data.success) {
            throw new Error('Response not successful');
        }
        console.log(`   User: ${response.data.data.email}`);
        return response.data;
    });

    await runTest('GET /api/auth/profile - Get Profile (Alias)', async () => {
        const response = await api.get('/api/auth/profile');
        if (!response.data.success) {
            throw new Error('Response not successful');
        }
        return response.data;
    });

    // ==========================================
    // 3. AUDIO PROCESSING TESTS
    // ==========================================
    printHeader('3. Audio Processing Tests');

    // Create test audio file
    const testAudioPath = createDummyAudioFile('test_comprehensive.wav');
    console.log(`   Created test audio: ${testAudioPath}\n`);

    await runTest('POST /api/audio-processing/upload - Upload Audio', async () => {
        const form = new FormData();
        form.append('audio', fs.createReadStream(testAudioPath));

        const response = await axios.post(
            `${BASE_URL}/api/audio-processing/upload`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                },
                timeout: TIMEOUT,
            }
        );

        if (response.data.success && response.data.data.audioLogId) {
            testAudioLogId = response.data.data.audioLogId;
            console.log(`   Audio Log ID: ${testAudioLogId}`);
            console.log(`   Transcript: ${response.data.data.transcript?.substring(0, 50)}...`);
        }
        return response.data;
    });

    await runTest('GET /api/audio-processing/logs - List Audio Logs', async () => {
        const response = await api.get('/api/audio-processing/logs?limit=5');
        if (!response.data.success) {
            throw new Error('Response not successful');
        }
        console.log(`   Total logs: ${response.data.meta?.total || response.data.data?.length || 0}`);
        return response.data;
    });

    await runTest('GET /api/audio-processing/logs/:id - Get Specific Log', async () => {
        if (!testAudioLogId) {
            throw new Error('No audio log ID from previous test');
        }
        const response = await api.get(`/api/audio-processing/logs/${testAudioLogId}`);
        return response.data;
    }, !testAudioLogId);

    // ==========================================
    // 4. LEGACY LOG ROUTES TESTS
    // ==========================================
    printHeader('4. Legacy Log Routes Tests');

    await runTest('GET /api/log - List Logs (Legacy Route)', async () => {
        const response = await api.get('/api/log?page=1&limit=5');
        return response.data;
    });

    // ==========================================
    // 5. WEEKLY SUMMARY TESTS
    // ==========================================
    printHeader('5. Weekly Summary Tests');

    await runTest('POST /api/audio-processing/summary/generate - Generate Summary', async () => {
        const response = await api.post('/api/audio-processing/summary/generate', {});
        console.log(`   Phase: ${response.data.data?.phase || 'N/A'}`);
        console.log(`   Headline: ${response.data.data?.story?.headline || 'N/A'}`);
        return response.data;
    });

    await runTest('GET /api/audio-processing/summary - Get Current Week Summary', async () => {
        const response = await api.get('/api/audio-processing/summary');
        return response.data;
    });

    await runTest('GET /api/summary - List All Summaries', async () => {
        const response = await api.get('/api/summary');
        console.log(`   Total summaries: ${response.data.meta?.total || response.data.data?.length || 0}`);
        return response.data;
    });

    // Get current week ID for testing
    const now = new Date();
    const year = now.getFullYear();
    const weekNum = getWeekNumber(now);
    const weekId = `${year}-W${String(weekNum).padStart(2, '0')}`;

    await runTest(`GET /api/summary/${weekId} - Get Week by ID`, async () => {
        const response = await api.get(`/api/summary/${weekId}`);
        return response.data;
    });

    // ==========================================
    // 6. CHAT TESTS
    // ==========================================
    printHeader('6. Chat Tests');

    await runTest('POST /api/chat/sessions - Create Chat Session', async () => {
        const response = await api.post('/api/chat/sessions');
        if (response.data.success && response.data.data.sessionId) {
            testChatSessionId = response.data.data.sessionId;
            console.log(`   Session ID: ${testChatSessionId}`);
        }
        return response.data;
    });

    await runTest('POST /api/chat - Send Chat Message', async () => {
        const response = await api.post('/api/chat', {
            message: 'Hello! Can you analyze my productivity this week?',
            sessionId: testChatSessionId,
        });
        console.log(`   Response: ${response.data.data?.message?.substring(0, 80)}...`);
        return response.data;
    });

    await runTest('POST /api/chat - Follow-up Message', async () => {
        const response = await api.post('/api/chat', {
            message: 'What areas should I improve?',
            sessionId: testChatSessionId,
        });
        return response.data;
    });

    await runTest('GET /api/chat/sessions - List All Sessions', async () => {
        const response = await api.get('/api/chat/sessions?limit=10');
        console.log(`   Sessions found: ${response.data.data?.length || 0}`);
        return response.data;
    });

    await runTest('GET /api/chat/sessions/:id - Get Session History', async () => {
        if (!testChatSessionId) {
            throw new Error('No chat session ID');
        }
        const response = await api.get(`/api/chat/sessions/${testChatSessionId}`);
        console.log(`   Messages in history: ${response.data.data?.length || 0}`);
        return response.data;
    }, !testChatSessionId);

    // ==========================================
    // 7. CLEANUP TESTS
    // ==========================================
    printHeader('7. Cleanup Tests (DELETE operations)');

    await runTest('DELETE /api/chat/sessions/:id - Delete Chat Session', async () => {
        if (!testChatSessionId) {
            throw new Error('No chat session ID');
        }
        const response = await api.delete(`/api/chat/sessions/${testChatSessionId}`);
        console.log(`   Deleted messages: ${response.data.data?.deletedCount || 0}`);
        return response.data;
    }, !testChatSessionId);

    await runTest('DELETE /api/audio-processing/logs/:id - Delete Audio Log', async () => {
        if (!testAudioLogId) {
            throw new Error('No audio log ID');
        }
        const response = await api.delete(`/api/audio-processing/logs/${testAudioLogId}`);
        return response.data;
    }, !testAudioLogId);

    // ==========================================
    // 8. ERROR HANDLING TESTS
    // ==========================================
    printHeader('8. Error Handling Tests');

    await runTest('GET /api/log/invalid-id - 404 Not Found', async () => {
        try {
            await api.get('/api/log/000000000000000000000000');
            throw new Error('Should have returned 404');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return { status: 404, message: 'Correctly returned 404' };
            }
            throw error;
        }
    });

    await runTest('GET /api/summary/invalid-format - 400 Bad Request', async () => {
        try {
            await api.get('/api/summary/not-a-week-id');
            throw new Error('Should have returned 400');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                return { status: 400, message: 'Correctly returned 400' };
            }
            throw error;
        }
    });

    await runTest('POST /api/chat - Empty Message (Validation)', async () => {
        try {
            await api.post('/api/chat', { message: '' });
            throw new Error('Should have returned validation error');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status >= 400) {
                return { status: error.response.status, message: 'Correctly validated' };
            }
            throw error;
        }
    });

    // ==========================================
    // CLEANUP
    // ==========================================
    printHeader('Cleanup');

    try {
        fs.unlinkSync(testAudioPath);
        console.log('✅ Cleaned up test audio file');
    } catch (e) {
        console.log('⚠️  Could not clean up test file');
    }

    // ==========================================
    // RESULTS
    // ==========================================
    printSummary();

    // Exit with appropriate code
    const failed = results.filter(r => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Run all tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
