import client, { setCache, getCache, delCache, getVersion, invalidateVersion, getRedisHealth } from './config/redisClient.js';

async function runTest() {
  console.log("═══════════════════════════════════════════");
  console.log("  🔍 REDIS COMPREHENSIVE DIAGNOSTIC TEST");
  console.log("═══════════════════════════════════════════\n");

  try {
    // ── 1. Health Check ──
    console.log("── Step 1: Health Check ──");
    const health = await getRedisHealth();
    console.log(`   Status:     ${health.status}`);
    console.log(`   Ping OK:    ${health.ping?.ok ?? 'N/A'}`);
    console.log(`   Latency:    ${health.ping?.latencyMs ?? 'N/A'}ms`);

    if (!health.ping?.ok) {
      console.log("\n❌ PING FAILED — Redis is not reachable.");
      console.log("   Error:", health.ping?.error || health.ping?.message || 'Unknown');
      console.log("\n   Possible causes:");
      console.log("   • REDIS_URL is missing or wrong in .env");
      console.log("   • Upstash instance is paused/deleted");
      console.log("   • Network/firewall is blocking port 6379");
      process.exit(1);
    }

    // ── 2. Write Test ──
    console.log("\n── Step 2: Write Operation ──");
    const testData = { msg: "Redis is fully operational!", timestamp: Date.now() };
    const setOk = await setCache("diag:test_write", testData, 30);
    console.log(`   Write OK:   ${setOk}`);
    if (!setOk) {
      console.log("\n❌ WRITE FAILED — Cannot store data in Redis.");
      process.exit(1);
    }

    // ── 3. Read Test ──
    console.log("\n── Step 3: Read Operation ──");
    const readVal = await getCache("diag:test_write");
    console.log(`   Read value: ${JSON.stringify(readVal)}`);
    const readOk = readVal && readVal.msg === testData.msg;
    console.log(`   Match:      ${readOk}`);
    if (!readOk) {
      console.log("\n❌ READ FAILED — Data read does not match what was written.");
      process.exit(1);
    }

    // ── 4. Delete Test ──
    console.log("\n── Step 4: Delete Operation ──");
    const delOk = await delCache("diag:test_write");
    console.log(`   Delete OK:  ${delOk}`);
    const afterDel = await getCache("diag:test_write");
    // After delete, L1 is cleared; L2 is cleared. Value should be null.
    const delVerified = afterDel === null;
    console.log(`   Verified:   ${delVerified}`);

    // ── 5. Version Test ──
    console.log("\n── Step 5: Cache Versioning ──");
    const v1 = await getVersion("diag:test");
    console.log(`   Version 1:  ${v1}`);
    await invalidateVersion("diag:test");
    const v2 = await getVersion("diag:test");
    console.log(`   Version 2:  ${v2}`);
    const versionChanged = v1 !== v2;
    console.log(`   Changed:    ${versionChanged}`);

    // ── 6. Final Health Snapshot ──
    console.log("\n── Step 6: Final Health Snapshot ──");
    const finalHealth = await getRedisHealth();
    console.log(`   Total Ops:  ${finalHealth.stats.totalOperations}`);
    console.log(`   Failed:     ${finalHealth.stats.failedOperations}`);
    console.log(`   Hit Rate:   ${finalHealth.stats.hitRate}`);
    console.log(`   L1 Size:    ${finalHealth.stats.l1CacheSize}`);

    // ── Summary ──
    console.log("\n═══════════════════════════════════════════");
    const allPassed = setOk && readOk && delOk && versionChanged;
    if (allPassed) {
      console.log("  ✅ ALL TESTS PASSED — Redis is fully operational");
    } else {
      console.log("  ⚠️  SOME TESTS FAILED — check output above");
    }
    console.log("═══════════════════════════════════════════\n");

  } catch (err) {
    console.error("\n💥 UNEXPECTED ERROR:", err);
  } finally {
    if (client && client.isOpen) {
      await client.quit();
    }
    process.exit(0);
  }
}

runTest();
