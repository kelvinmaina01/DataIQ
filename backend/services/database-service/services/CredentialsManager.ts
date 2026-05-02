/**
 * Credentials Manager
 * Handles encryption/decryption of database credentials
 */

import crypto from "crypto";
import { injectable } from "tsyringe";
import { supabase } from "../../../supabase/supabaseClient";

@injectable()
export class CredentialsManager {
    private readonly ALGORITHM = "aes-256-gcm";
    private readonly ENCRYPTION_KEY: Buffer;

    constructor() {
        const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
        if (!key) {
            throw new Error("CREDENTIALS_ENCRYPTION_KEY environment variable is required");
        }
        this.ENCRYPTION_KEY = Buffer.from(key, "hex");
    }

    /**
     * Encrypt credentials before storage
     */
    encrypt(credentials: any): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.ALGORITHM,
            this.ENCRYPTION_KEY,
            iv
        );

        let encrypted = cipher.update(JSON.stringify(credentials), "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag().toString("hex");

        return JSON.stringify({
            iv: iv.toString("hex"),
            content: encrypted,
            tag: authTag
        });
    }

    /**
     * Decrypt credentials from storage
     */
    decrypt(encryptedData: string): any {
        const { iv, content, tag } = JSON.parse(encryptedData);

        const decipher = crypto.createDecipheriv(
            this.ALGORITHM,
            this.ENCRYPTION_KEY,
            Buffer.from(iv, "hex")
        );

        decipher.setAuthTag(Buffer.from(tag, "hex"));

        let decrypted = decipher.update(content, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return JSON.parse(decrypted);
    }

    /**
     * Store encrypted credentials in Supabase
     */
    async storeCredentials(
        userId: string,
        connectionId: string,
        connectorType: string,
        connectionName: string,
        credentials: any
    ): Promise<void> {
        const encrypted = this.encrypt(credentials);

        const { error } = await supabase
            .from("database_connections")
            .upsert({
                id: connectionId,
                user_id: userId,
                connector_type: connectorType,
                connection_name: connectionName,
                encrypted_credentials: encrypted,
                status: 'active',
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('[CredentialsManager] Store error:', error);
            throw error;
        }

        console.log('[CredentialsManager] Credentials stored successfully:', connectionId);
    }

    /**
     * Retrieve and decrypt credentials
     */
    async getCredentials(connectionId: string): Promise<any> {
        const { data, error } = await supabase
            .from("database_connections")
            .select("encrypted_credentials")
            .eq("id", connectionId)
            .single();

        if (error) {
            console.error('[CredentialsManager] Retrieve error:', error);
            throw error;
        }

        if (!data) {
            throw new Error("Connection not found");
        }

        return this.decrypt(data.encrypted_credentials);
    }

    /**
     * Delete credentials
     */
    async deleteCredentials(connectionId: string): Promise<void> {
        const { error } = await supabase
            .from("database_connections")
            .delete()
            .eq("id", connectionId);

        if (error) {
            console.error('[CredentialsManager] Delete error:', error);
            throw error;
        }

        console.log('[CredentialsManager] Credentials deleted:', connectionId);
    }
}
