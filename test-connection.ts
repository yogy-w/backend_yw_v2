// test-connection.ts
import { Client } from "pg";

async function test() {
  const client = new Client({
    host: "aws-1-ap-southeast-1.pooler.supabase.com",
    port: "6543",
    user: "postgres.thhpaqktaqpxztkqrear",
    password: "GFwF6kvbmHfIu1FA",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Koneksi berhasil!");
    const res = await client.query("SELECT NOW()");
    console.log(res.rows);
  } catch (err) {
    console.error("❌ Koneksi gagal:", err);
  } finally {
    await client.end();
  }
}

test();
