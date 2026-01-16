/**
 * Automated Backend API Test Script
 * 
 * Usage: 
 * 1. Ensure server is running (npm run dev)
 * 2. Set TEST_TOKEN env var with a valid Auth0 JWT
 * 3. Run: npx ts-node scripts/test-api.ts
 */

import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.TEST_TOKEN;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

const passed = (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`);
const failed = (msg: string, err?: any) => {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
  if (err?.response?.data) {
    console.log('  Error Data:', JSON.stringify(err.response.data, null, 2));
  } else if (err?.message) {
    console.log('  Error:', err.message);
  }
};
const info = (msg: string) => console.log(`\n${colors.blue}${colors.bold}--- ${msg} ---${colors.reset}`);

async function runTests() {
  console.log(`${colors.bold}Starting Backend API Verification...${colors.reset}`);
  console.log(`Target: ${API_URL}\n`);

  if (!TOKEN) {
    console.log(`${colors.yellow}WARNING: TEST_TOKEN env var not set.${colors.reset}`);
    console.log('Authorized tests will fail. Set it via: export TEST_TOKEN=ey...');
    // We continue to run public tests
  }

  // 1. Health Check
  info('1. System Health');
  try {
    const res = await axios.get(`${API_URL}/health`);
    if (res.status === 200 && res.data.status === 'ok') {
      passed('Health check passed');
    } else {
      failed(`Health check returned status ${res.status} / ${res.data.status}`);
    }
  } catch (err) {
    failed('Health check failed', err);
  }

  if (!TOKEN) return;

  // 2. Authentication
  info('2. Authentication');
  let userId: string = '';
  try {
    const res = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (res.data.success) {
      passed(`User authenticated: ${res.data.data.email} (${res.data.data.id})`);
      userId = res.data.data.id;
    } else {
      failed('Auth response unexpected format');
    }
  } catch (err) {
    failed('Authentication failed', err);
    return; // Stop if auth fails
  }

  // 3. Audio Log Upload
  info('3. Audio Logging');
  let logId: string = '';
  try {
    // Create a dummy audio file if it doesn't exist
    const dummyAudioPath = path.join(__dirname, 'test-audio.mp3');
    if (!fs.existsSync(dummyAudioPath)) {
      // Create a dummy file (just text content, but named mp3 to test mime type logic if just extension checking,
      // but real validation might fail if it checks magic numbers. 
      // For this test script, we assume a real file is needed or we create a minimal valid empty file? 
      // Let's create a text file mimicking content for now, ideally user supplies real audio.
      fs.writeFileSync(dummyAudioPath, 'fake audio content');
      console.log(`${colors.yellow}Created dummy test-audio.mp3 (validation might fail if strict magic number check)${colors.reset}`);
    }

    const form = new FormData();
    form.append('audio', fs.createReadStream(dummyAudioPath));

    const res = await axios.post(`${API_URL}/api/log`, form, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...form.getHeaders(),
      },
      validateStatus: (status) => status < 500, // Handle 400s gracefully
    });

    if (res.status === 201 && res.data.success) {
      passed(`Audio uploaded successfully. ID: ${res.data.logId}`);
      logId = res.data.logId;
    } else if (res.status === 400) {
      // If validation fails due to dummy file
      console.log(`${colors.yellow}⚠ Upload rejected (likely validation): ${res.data.error.message}${colors.reset}`);
    } else {
      failed('Audio upload failed', res);
    }
    
    // Cleanup dummy file
    if (fs.existsSync(dummyAudioPath)) fs.unlinkSync(dummyAudioPath);

  } catch (err) {
    failed('Audio upload request error', err);
  }

  // 4. Chat
  info('4. Chat System');
  try {
    const res = await axios.post(`${API_URL}/api/chat`, {
      message: 'Hello, verify deployment.',
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    
    if (res.data.success) {
      passed(`Chat success. Reply: "${res.data.data.message.substring(0, 30)}..."`);
    } else {
      failed('Chat failed');
    }
  } catch (err) {
    failed('Chat request error', err);
  }

  // 5. Cleanup
  if (logId) {
    info('5. Cleanup (Delete Log)');
    try {
      await axios.delete(`${API_URL}/api/log/${logId}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      passed(`Log ${logId} deleted`);
    } catch (err) {
      failed(`Failed to delete log ${logId}`, err);
    }
  }

  console.log(`\n${colors.bold}Tests Completed.${colors.reset}`);
}

runTests();
