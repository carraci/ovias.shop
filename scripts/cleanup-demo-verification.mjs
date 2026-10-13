import fs from "node:fs/promises";
import { MongoClient } from "mongodb";
const file = "artifacts/demo-verification/environment.json";
const setup = JSON.parse(await fs.readFile(file, "utf8"));
if (setup.origin !== "http://localhost:3128" || !/^ovia_verification_\d+_[a-f0-9]{6}$/.test(setup.database)) throw Error("Refusing cleanup outside the disposable demo database.");
const client = await new MongoClient(process.env.MONGODB_URI).connect();
try {
  await client.db(setup.database).dropDatabase();
  // A setup attempt created only its fixture records before the Windows preload path was corrected.
  await client.db("ovia_verification_1791829516723_b6882e").dropDatabase();
  await fs.writeFile(file, JSON.stringify({ ...setup, cleanedUpAt: new Date().toISOString() }, null, 2));
  console.log("Disposable verification databases removed; report evidence retained.");
} finally { await client.close(); }
