import test from "node:test";
import assert from "node:assert/strict";
import {updateReturnStatus} from "../src/server/admin-service";
test("manual return status cannot claim a provider refund", async () => {
  await assert.rejects(updateReturnStatus({returnId:"unverified", status:"Refunded", actor:"owner@example.test"}), /must be issued and verified through Payments/);
});
