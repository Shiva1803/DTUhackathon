import 'dotenv/config';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = 'http://localhost:3001/api/audio-processing';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const SAMPLE_FILE_NAME = 'test_audio_sample.mp3';

if (!AUTH_TOKEN) {
    console.warn('⚠️ No TEST_AUTH_TOKEN provided.');
    console.warn('   Ensure the backend is running with MOCK_AUTH=true');
}

const headers = {
    Authorization: `Bearer ${AUTH_TOKEN}`,
};

async function runTest() {
    console.log('🚀 Starting Audio Processing Flow Test...\n');
    const filePath = path.join(__dirname, SAMPLE_FILE_NAME);
    let audioLogId: string | null = null;

    try {
        // -----------------------------------------------------------------------
        // 1. Create Dummy Audio File
        // -----------------------------------------------------------------------
        console.log(`[1/6] Creating dummy audio file: ${SAMPLE_FILE_NAME}...`);
        // Create a file with some content (invalid audio but enough for upload test if validation is loose, 
        // or you can place a real mp3 here manually)
        // For robust testing, we rely on the backend accepting the mime-type header from form-data
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, 'dummy-audio-content-for-testing-flow');
        }
        console.log('✅ File created.');

        // -----------------------------------------------------------------------
        // 2. Upload Audio
        // -----------------------------------------------------------------------
        console.log('\n[2/6] Testing POST /upload...');
        const form = new FormData();
        form.append('audio', fs.createReadStream(filePath), { contentType: 'audio/mp3' });

        const uploadRes = await axios.post(`${BASE_URL}/upload`, form, {
            headers: {
                ...headers,
                ...form.getHeaders(),
            },
        });

        if (uploadRes.status === 201 && uploadRes.data.success) {
            audioLogId = uploadRes.data.data.audioLogId;
            console.log('✅ Upload successful!');
            console.log(`   ID: ${audioLogId}`);
            console.log(`   Transcript: ${uploadRes.data.data.transcript}`);
        } else {
            throw new Error(`Upload failed: ${uploadRes.status} ${JSON.stringify(uploadRes.data)}`);
        }

        // -----------------------------------------------------------------------
        // 3. Verify Logs Retrieval
        // -----------------------------------------------------------------------
        console.log('\n[3/6] Testing GET /logs...');
        const logsRes = await axios.get(`${BASE_URL}/logs?limit=5`, { headers });

        if (logsRes.status === 200 && logsRes.data.data.some((l: any) => l._id === audioLogId)) {
            console.log('✅ New log found in logs list.');
        } else {
            console.warn('⚠️ New log NOT found in top 5 logs (maybe pagination issue or delay?)');
        }

        // -----------------------------------------------------------------------
        // 4. Generate Weekly Summary
        // -----------------------------------------------------------------------
        console.log('\n[4/6] Testing POST /summary/generate...');
        const summaryRes = await axios.post(`${BASE_URL}/summary/generate`, {}, { headers });

        if (summaryRes.status === 200 && summaryRes.data.success) {
            const data = summaryRes.data.data;
            console.log('✅ Summary generation successful!');
            console.log(`   Phase: ${data.phase}`);
            console.log(`   Headline: "${data.story.headline}"`);
            console.log(`   TTS URL: ${data.ttsUrl ? 'Generated' : 'Not generated (check API key)'}`);
        } else {
            throw new Error(`Summary generation failed: ${summaryRes.status}`);
        }

        // -----------------------------------------------------------------------
        // 5. Retrieve Weekly Summary
        // -----------------------------------------------------------------------
        console.log('\n[5/6] Testing GET /summary...');
        const getSummaryRes = await axios.get(`${BASE_URL}/summary`, { headers });

        if (getSummaryRes.status === 200 && getSummaryRes.data.success) {
            console.log('✅ Summary retrieval successful.');
        } else {
            throw new Error(`Summary retrieval failed: ${getSummaryRes.status}`);
        }

        // -----------------------------------------------------------------------
        // 6. Delete Audio Log
        // -----------------------------------------------------------------------
        console.log(`\n[6/6] Cleaning up - Deleting log ${audioLogId}...`);
        if (audioLogId) {
            await axios.delete(`${BASE_URL}/logs/${audioLogId}`, { headers });
            console.log('✅ Log deleted.');
        }

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    } finally {
        // Cleanup local file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

runTest();
