import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getDmsUploadRoot, resolveSafeDmsPath } from './dms-storage-path.util';

@Injectable()
export class DmsStorageService {
  /**
   * Saves a file buffer to the given relative DMS storage path.
   * Creates intermediate directories as needed.
   */
  async save(relativePath: string, buffer: Buffer): Promise<void> {
    const absolutePath = resolveSafeDmsPath(relativePath);
    const dir = resolve(absolutePath, '..');
    await mkdir(dir, { recursive: true });
    await writeFile(absolutePath, buffer);
  }

  /**
   * Reads a file from the given relative DMS storage path.
   */
  async read(relativePath: string): Promise<Buffer> {
    const absolutePath = resolveSafeDmsPath(relativePath);
    try {
      return await readFile(absolutePath);
    } catch {
      throw new NotFoundException('File dokumen DMS tidak ditemukan di storage');
    }
  }

  /**
   * Deletes a file from storage. Silently ignores missing files.
   */
  async delete(relativePath: string): Promise<void> {
    try {
      const absolutePath = resolveSafeDmsPath(relativePath);
      await unlink(absolutePath);
    } catch {
      // file may already be gone — not an error
    }
  }

  getUploadRoot(): string {
    return getDmsUploadRoot();
  }

  resolveSafe(relativePath: string): string {
    return resolveSafeDmsPath(relativePath);
  }
}
