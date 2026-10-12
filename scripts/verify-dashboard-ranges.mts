import nextEnv from '@next/env';nextEnv.loadEnvConfig(process.cwd());
const {getDashboardOverview}=await import('../src/server/admin-service');
const {mongo}=await import('../src/server/db');
const today=await getDashboardOverview({from:'2026-10-04',to:'2026-10-04'});
const month=await getDashboardOverview({from:'2026-10-01',to:'2026-10-31'});
console.log(JSON.stringify({today:today.salesOverview,month:month.salesOverview}));
await (await mongo()).close();
