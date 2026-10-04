import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { appendFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import csv = require('csv-parser');

export interface Teacher {
  sno: string;
  tscNo: string;
  idNumber: string;
  name: string;
  station: string;
  mobileNo: string;
  category: string;
  county: string;
  region: string;
}

@Injectable()
export class EmployeeService implements OnModuleInit {
  private readonly logger = new Logger(EmployeeService.name);
  private teachers = new Map<string, Teacher>();
  private readonly csvPath = join(process.cwd(), 'data', 'teachersday.csv');
  private readonly auditPath = join(process.cwd(), 'logs', 'verifications.csv');
  private csvSignature = '';

  async onModuleInit(): Promise<void> {
    await this.loadEmployees();
    await this.prepareAuditLog();
  }

  async verify(idNumber: string): Promise<{ verified: true; teacher: Teacher } | { verified: false }> {
    await this.refreshTeachersIfChanged();
    const teacher = this.teachers.get(idNumber);
    const result = teacher ? 'VERIFIED' : 'NOT VERIFIED';
    this.logger.log(`Verification ${result} for ID ending ${idNumber.slice(-2)}`);

    try {
      await appendFile(
        this.auditPath,
        `${this.formatEatTimestamp(new Date())},${idNumber},${result}\n`,
        'utf8',
      );
    } catch (error) {
      this.logger.error('Unable to write verification audit entry', error);
    }

    return teacher ? { verified: true, teacher } : { verified: false };
  }

  private async loadEmployees(): Promise<void> {
    const fileStat = await stat(this.csvPath).catch((error: Error) => {
      this.logger.error(`Unable to read employee CSV at ${this.csvPath}`, error.stack);
      throw new InternalServerErrorException('Employee records could not be loaded');
    });
    const updatedTeachers = new Map<string, Teacher>();

    await new Promise<void>((resolve, reject) => {
      createReadStream(this.csvPath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/[.\s]+/g, '') }))
        .on('data', (row: Record<string, string>) => {
          const teacher: Teacher = {
            sno: row.sno?.trim(),
            tscNo: row.tscno?.trim(),
            idNumber: row.idnum?.trim(),
            name: row.name?.trim(),
            station: row.station?.trim(),
            mobileNo: row.mobileno?.trim(),
            category: row.category?.trim(),
            county: row.county?.trim(),
            region: row.region?.trim(),
          };

          if (teacher.idNumber && teacher.idNumber !== '0') {
            updatedTeachers.set(teacher.idNumber, teacher);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    }).catch((error: Error) => {
      this.logger.error(`Unable to load employee CSV at ${this.csvPath}`, error.stack);
      throw new InternalServerErrorException('Employee records could not be loaded');
    });

    this.teachers = updatedTeachers;
    this.csvSignature = `${fileStat.mtimeMs}:${fileStat.ctimeMs}:${fileStat.size}:${fileStat.ino}`;
    this.logger.log(`Loaded ${this.teachers.size} teacher records from teachersday.csv`);
  }

  private async refreshTeachersIfChanged(): Promise<void> {
    const fileStat = await stat(this.csvPath).catch((error: Error) => {
      this.logger.error(`Unable to check employee CSV at ${this.csvPath}`, error.stack);
      throw new InternalServerErrorException('Employee records could not be checked');
    });
    const signature = `${fileStat.mtimeMs}:${fileStat.ctimeMs}:${fileStat.size}:${fileStat.ino}`;

    if (signature !== this.csvSignature) {
      await this.loadEmployees();
    }
  }

  private async prepareAuditLog(): Promise<void> {
    await mkdir(join(process.cwd(), 'logs'), { recursive: true });
    try {
      await appendFile(this.auditPath, 'timestamp,idNumber,result\n', {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }

    const contents = await readFile(this.auditPath, 'utf8');
    const lineEnding = contents.includes('\r\n') ? '\r\n' : '\n';
    const lines = contents.split(/\r?\n/);
    let normalized = false;

    if (lines[0] === 'gitimestamp,idNumber,result') {
      lines[0] = 'timestamp,idNumber,result';
      normalized = true;
    }

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index];
      const separator = line.indexOf(',');
      if (separator < 0) continue;

      const timestamp = line.slice(0, separator);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp)) continue;

      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) continue;
      lines[index] = `${this.formatEatTimestamp(date)}${line.slice(separator)}`;
      normalized = true;
    }

    if (normalized) {
      await writeFile(this.auditPath, lines.join(lineEnding), 'utf8');
      this.logger.log('Normalized verification audit timestamps to EAT (UTC+3)');
    }
  }

  private formatEatTimestamp(date: Date): string {
    const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${eatDate.getUTCFullYear()}-${pad(eatDate.getUTCMonth() + 1)}-${pad(eatDate.getUTCDate())} ${pad(eatDate.getUTCHours())}:${pad(eatDate.getUTCMinutes())}:${pad(eatDate.getUTCSeconds())}`;
  }
}