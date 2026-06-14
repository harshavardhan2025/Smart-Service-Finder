import client, { setCache, getCache } from './config/redisClient.js';

async function runTest() {
  console.log("Checking Redis Client status...");
  try {
    const setOk = await setCache("test_key", { msg: "Redis connection is fully operational!" }, 10);
    console.log("Write operation successful:", setOk);

    const val = await getCache("test_key");
    console.log("Read value from cache:", val);

    if (val && val.msg) {
      console.log("✅ REDIS TEST PASSED SUCCESSFULLY!");
    } else {
      console.log("❌ REDIS TEST FAILED!");
    }
  } catch (err) {
    console.error("💥 REDIS DIAGNOSTIC ERROR:", err);
  } finally {
    if (client && client.isOpen) {
      await client.quit();
    }
    process.exit(0);
  }
}

runTest();
