import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test',...(process.argv.length>2?process.argv.slice(2):['tests/ui/liveops-online.spec.js']),'--project','desktop','--output','runtime/qa/rewards-spark-online-traces'],
 {stdio:'inherit',env:{...process.env,VITE_FIREBASE_USE_EMULATORS:'1',GAME_SHELL_TEST_PORT:'4197'}});
process.exitCode=result.status??1;
