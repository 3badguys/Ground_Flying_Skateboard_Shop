import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

const FILE_RE = /^gfs_database_\d{8}_\d{6}\.sql$/;
const KEEP_DAYS = 30;

export interface BackupItem {
  name: string;
  size: number;
  createdAt: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

@Injectable()
export class BackupService {
  private readonly backupDir: string;
  private readonly dbUrl: string;

  constructor(private readonly config: ConfigService) {
    this.backupDir =
      this.config.get<string>('BACKUP_DIR') ||
      path.join(process.cwd(), 'backups');
    this.dbUrl = this.config.get<string>('DATABASE_URL') || '';
  }

  /** Validate filename and resolve to an absolute path inside backupDir. */
  private safePath(name: string): string {
    if (!FILE_RE.test(name)) throw new BadRequestException('非法文件名');
    return path.join(this.backupDir, name);
  }

  private errMsg(e: any): string {
    if (e?.code === 'ENOENT') return '未找到 pg_dump/psql，请确认已安装 PostgreSQL 客户端';
    return e?.stderr?.trim() || e?.message || '未知错误';
  }

  /** Generate a plain-SQL dump, auto-download via frontend. */
  async create(): Promise<BackupItem> {
    if (!this.dbUrl) throw new BadRequestException('缺少 DATABASE_URL 配置');
    await fs.mkdir(this.backupDir, { recursive: true });

    const now = new Date();
    const name =
      `gfs_database_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.sql`;
    const file = path.join(this.backupDir, name);

    try {
      await execFileAsync('pg_dump', [
        `--dbname=${this.dbUrl}`,
        '--clean',
        '--if-exists',
        `--file=${file}`,
      ]);
    } catch (e: any) {
      throw new BadRequestException(`备份失败：${this.errMsg(e)}`);
    }

    const stat = await fs.stat(file);
    await this.cleanupOld();
    return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
  }

  async list(): Promise<BackupItem[]> {
    await fs.mkdir(this.backupDir, { recursive: true });
    const entries = await fs.readdir(this.backupDir);
    const items = await Promise.all(
      entries
        .filter((f) => FILE_RE.test(f))
        .map(async (f) => {
          const st = await fs.stat(path.join(this.backupDir, f));
          return { name: f, size: st.size, createdAt: st.mtime.toISOString() };
        }),
    );
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Absolute path for streaming download. */
  async download(name: string): Promise<string> {
    const file = this.safePath(name);
    try {
      await fs.access(file);
    } catch {
      throw new NotFoundException('备份文件不存在');
    }
    return file;
  }

  async remove(name: string): Promise<{ success: boolean }> {
    const file = this.safePath(name);
    try {
      await fs.unlink(file);
    } catch (e: any) {
      if (e?.code === 'ENOENT') throw new NotFoundException('备份文件不存在');
      throw e;
    }
    return { success: true };
  }

  /**
   * Restore from an uploaded .sql dump.
   * psql runs with --single-transaction + ON_ERROR_STOP so any failure rolls back.
   */
  async restore(buffer: Buffer, originalName: string): Promise<{ success: boolean }> {
    if (!/\.sql$/i.test(originalName)) {
      throw new BadRequestException('仅支持 .sql 备份文件');
    }
    if (!this.dbUrl) throw new BadRequestException('缺少 DATABASE_URL 配置');

    await fs.mkdir(this.backupDir, { recursive: true });
    const tmp = path.join(this.backupDir, `.restore_${Date.now()}.sql`);
    await fs.writeFile(tmp, buffer);

    try {
      await execFileAsync('psql', [
        `--dbname=${this.dbUrl}`,
        '-v',
        'ON_ERROR_STOP=1',
        '--single-transaction',
        '-f',
        tmp,
      ]);
    } catch (e: any) {
      throw new BadRequestException(`恢复失败：${this.errMsg(e)}`);
    } finally {
      await fs.unlink(tmp).catch(() => {});
    }
    return { success: true };
  }

  /** Delete backup files older than KEEP_DAYS (30). */
  private async cleanupOld(): Promise<void> {
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    const entries = await fs.readdir(this.backupDir);
    await Promise.all(
      entries
        .filter((f) => FILE_RE.test(f))
        .map(async (f) => {
          const file = path.join(this.backupDir, f);
          try {
            const st = await fs.stat(file);
            if (st.mtimeMs < cutoff) await fs.unlink(file);
          } catch {
            /* ignore */
          }
        }),
    );
  }
}
