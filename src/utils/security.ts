export const hashPassword = async (password: string): Promise<string> => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password).buffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // To keep it simple and standard:
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${saltHex}:${hashHex}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
    // Handle legacy SHA-256 hashes (if any, though we break them, this is a path to migration)
    if (!storedHash.includes(":")) {
        // Assume old SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const oldHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return oldHash === storedHash;
    }

    const [saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        256
    );
    
    const derivedHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, "0")).join("");
    return derivedHex === hashHex;
};

// Encryption Utilities for Sensitive Data (AES-GCM)
// Key should be derived from user password in memory, not stored.
export const deriveEncryptionKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
    enc.encode(password).buffer,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer as any,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
};

export const encryptData = async (data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(data);
    
    const ciphertextBuffer = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encoded
    );
    
    const ciphertext = Array.from(new Uint8Array(ciphertextBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
    
    return { ciphertext, iv: ivHex };
};

export const decryptData = async (ciphertext: string, iv: string, key: CryptoKey): Promise<string> => {
    const encryptedData = new Uint8Array(ciphertext.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ivData = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivData
        },
        key,
        encryptedData
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
};
