import fs from 'node:fs';
import { MongoClient } from 'mongodb';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/MONGODB_URI=(.*)/)[1].trim();
const dbName = (env.match(/MONGODB_DB=(.*)/) || [null, 'ovia'])[1].trim();
const client = new MongoClient(uri);

async function inspectSessions() {
  await client.connect();
  const db = client.db(dbName);
  const user = await db.collection('users').findOne({ email: 'adarshshukla4639@gmail.com' });
  console.log('User ID:', user?.id);
  const sessions = await db.collection('sessions').find({ userId: user?.id }).toArray();
  console.log('Total sessions count:', sessions.length);
  sessions.forEach((s, idx) => {
    console.log(idx, JSON.stringify(s));
  });
  await client.close();
}

inspectSessions().catch(console.error);
