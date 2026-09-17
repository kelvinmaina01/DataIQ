/**
 * Unit Tests for CredentialsManager
 */

import { CredentialsManager } from "../services/CredentialsManager";

describe("CredentialsManager", () => {
    let credentialsManager: CredentialsManager;

    beforeAll(() => {
        // Set test encryption key
        process.env.CREDENTIALS_ENCRYPTION_KEY = "690138bbfb2a9809ab12715815a27aaa5b193a49e6b81c2064570e28b54fd811";
    });

    beforeEach(() => {
        credentialsManager = new CredentialsManager();
    });

    describe("Encryption/Decryption", () => {
        it("should encrypt and decrypt credentials correctly", () => {
            const credentials = {
                host: "localhost",
                port: 5432,
                database: "test_db",
                username: "test_user",
                password: "test_password"
            };

            const encrypted = credentialsManager.encrypt(credentials);
            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe("string");

            const decrypted = credentialsManager.decrypt(encrypted);
            expect(decrypted).toEqual(credentials);
        });

        it("should produce different encrypted values for same input (due to random IV)", () => {
            const credentials = { username: "test", password: "pass" };

            const encrypted1 = credentialsManager.encrypt(credentials);
            const encrypted2 = credentialsManager.encrypt(credentials);

            expect(encrypted1).not.toBe(encrypted2);

            // But both should decrypt to same value
            expect(credentialsManager.decrypt(encrypted1)).toEqual(credentials);
            expect(credentialsManager.decrypt(encrypted2)).toEqual(credentials);
        });

        it("should fail to decrypt with tampered data", () => {
            const credentials = { username: "test", password: "pass" };
            const encrypted = credentialsManager.encrypt(credentials);

            // Tamper with encrypted data
            const parsed = JSON.parse(encrypted);
            parsed.content = parsed.content.slice(0, -2) + "FF";
            const tampered = JSON.stringify(parsed);

            expect(() => {
                credentialsManager.decrypt(tampered);
            }).toThrow();
        });
    });

    describe("Constructor", () => {
        it("should throw error if CREDENTIALS_ENCRYPTION_KEY is not set", () => {
            const originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
            delete process.env.CREDENTIALS_ENCRYPTION_KEY;

            expect(() => {
                new CredentialsManager();
            }).toThrow("CREDENTIALS_ENCRYPTION_KEY environment variable is required");

            process.env.CREDENTIALS_ENCRYPTION_KEY = originalKey;
        });
    });
});
