import { describe, it, expect, beforeAll } from "vitest";
import {
  hashPassword,
  verifyPassword,
  deriveEncryptionKey,
  encryptData,
  decryptData,
} from "./security";



describe("security", () => {
  describe("Password Hashing", () => {
    it("should hash a password and return a salt:hash string", async () => {
      const hash = await hashPassword("password123");
      expect(hash).toContain(":");
      const [salt, key] = hash.split(":");
      expect(salt.length).toBeGreaterThan(0);
      expect(key.length).toBeGreaterThan(0);
    });

    it("should verify a correct password", async () => {
      const password = "mySecretPassword";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await hashPassword("correctPassword");
      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });
    
    it("should handle legacy SHA-256 hashes (no colon)", async () => {
      
      const enc = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode("legacyPass"));
      const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      
      const isValid = await verifyPassword("legacyPass", hashHex);
      expect(isValid).toBe(true);
    });
  });

  describe("Encryption", () => {
    it("should encrypt and decrypt data correctly", async () => {
      const password = "encryptionPass";
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveEncryptionKey(password, salt);
      
      const sensitiveData = "This is a secret message";
      const { ciphertext, iv } = await encryptData(sensitiveData, key);
      
      expect(ciphertext).toBeDefined();
      expect(iv).toBeDefined();
      expect(ciphertext).not.toBe(sensitiveData);
      
      const decrypted = await decryptData(ciphertext, iv, key);
      expect(decrypted).toBe(sensitiveData);
    });
  });
});
