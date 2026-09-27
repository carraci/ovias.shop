import { MongoClient } from 'mongodb';
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not configured.'); process.exit(1); }
const client = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS:10000,connectTimeoutMS:10000});
try {
 await client.connect();
 const db=client.db(process.env.MONGODB_DB||'ovia');
 await db.command({ping:1});
 const count=await db.collection('products').countDocuments();
 console.log(`Atlas connected. Product records: ${count}.`);
} catch(e) {
 console.error(e.code===18?'Atlas authentication failed. Verify the database user credentials.':e.message?.includes('SSL')||e.message?.includes('TLS')?'Atlas TLS connection failed. Check Network Access, cluster status and network TLS restrictions.':'Atlas connection failed. Check cluster availability, DNS and network access.');
 process.exitCode=1;
} finally { await client.close(); }
