import { describe, expect, it } from "vitest";
import { Webhook } from "standardwebhooks";
import { verifyDodoWebhook } from "@/lib/dodo";

describe("webhook signature", () => {
  it("rejects missing standard webhooks headers", () => {
    expect(() =>
      verifyDodoWebhook("{}", {
        "webhook-id": "",
        "webhook-signature": "",
        "webhook-timestamp": "",
      }),
    ).toThrow(/Missing webhook signature headers/);
  });

  it("rejects a tampered body with standardwebhooks", () => {
    const secret = Buffer.from("whsec_test_secret_value_for_unit_tests").toString("base64");
    const webhook = new Webhook(secret);
    const id = "msg_test";
    const timestamp = new Date();
    const payload = JSON.stringify({ type: "payment.succeeded", data: {} });
    const signature = webhook.sign(id, timestamp, payload);
    const tampered = payload.replace("succeeded", "failed");
    expect(() =>
      webhook.verify(tampered, {
        "webhook-id": id,
        "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
        "webhook-signature": signature,
      }),
    ).toThrow();
  });
});
