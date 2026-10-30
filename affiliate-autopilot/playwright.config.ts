import {fileURLToPath} from 'node:url';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.ts',workers:1,use:{baseURL:'http://127.0.0.1:8766',launchOptions:{executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'}},webServer:{command:'python3 -m http.server 8766 --bind 127.0.0.1',cwd:fileURLToPath(new URL('../../',import.meta.url)),url:'http://127.0.0.1:8766/Abbas/affiliate-autopilot/',reuseExistingServer:false}});
