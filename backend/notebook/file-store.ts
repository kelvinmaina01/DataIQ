/**
 * DataIQ — Local File Store
 * Handles file uploads for notebook data sources.
 * Stores files locally in ./uploads with UUID-prefixed filenames.
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface StoredFile {
  id: string;
  filename: string;
  safeName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export class FileStore {
  /**
   * Store an uploaded file and return its metadata.
   */
  async store(
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StoredFile> {
    const fileId = uuidv4();
    const safeName = `${fileId}_${filename}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      id: fileId,
      filename,
      safeName,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve file content by ID.
   */
  async get(fileId: string): Promise<Buffer> {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const match = files.find(f => f.startsWith(fileId));
    if (!match) {
      throw new Error(`File not found: ${fileId}`);
    }
    return fs.promises.readFile(path.join(UPLOAD_DIR, match));
  }

  /**
   * Get the filesystem path for a stored file.
   */
  async getPath(fileId: string): Promise<string> {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const match = files.find(f => f.startsWith(fileId));
    if (!match) {
      throw new Error(`File not found: ${fileId}`);
    }
    return path.join(UPLOAD_DIR, match);
  }

  /**
   * List all stored files.
   */
  async list(): Promise<Array<{ id: string; filename: string; size: number; type: string }>> {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const result = [];

    for (const f of files) {
      const filePath = path.join(UPLOAD_DIR, f);
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) continue;

      const parts = f.split('_');
      const id = parts[0];
      const filename = parts.slice(1).join('_');

      result.push({
        id,
        filename: filename || f,
        size: stat.size,
        type: 'file',
      });
    }

    return result;
  }

  /**
   * Delete a stored file by ID.
   */
  async delete(fileId: string): Promise<void> {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const match = files.find(f => f.startsWith(fileId));
    if (match) {
      await fs.promises.unlink(path.join(UPLOAD_DIR, match));
    }
  }
}

export const fileStore = new FileStore();
