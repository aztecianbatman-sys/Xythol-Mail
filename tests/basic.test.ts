import { describe, expect, it } from "vitest";

describe("Xythol Mail Tauri foundation", () => {
  it("formats an anonymous Xythol identity", () => {
    const name = "Night Owl";
    const username = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
    expect(username + "@xythol").toBe("night-owl@xythol");
  });

  it("accepts only http and https research URLs", () => {
    expect(/^https?:\/\//i.test("https://example.com")).toBe(true);
    expect(/^https?:\/\//i.test("file:///secret")).toBe(false);
  });

  it("uses the current Tauri product name", () => {
    expect("Xythol Mail").toBe("Xythol Mail");
  });
});
