"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmployeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const csv = require("csv-parser");
let EmployeeService = EmployeeService_1 = class EmployeeService {
    constructor() {
        this.logger = new common_1.Logger(EmployeeService_1.name);
        this.employees = new Map();
        this.csvPath = (0, node_path_1.join)(process.cwd(), 'data', 'employees.csv');
        this.auditPath = (0, node_path_1.join)(process.cwd(), 'logs', 'verifications.csv');
        this.csvSignature = '';
    }
    async onModuleInit() {
        await this.loadEmployees();
        await this.prepareAuditLog();
    }
    async verify(idNumber) {
        await this.refreshEmployeesIfChanged();
        const employee = this.employees.get(idNumber);
        const result = employee ? 'VERIFIED' : 'NOT VERIFIED';
        this.logger.log(`Verification ${result} for ID ending ${idNumber.slice(-2)}`);
        try {
            await (0, promises_1.appendFile)(this.auditPath, `${this.formatEatTimestamp(new Date())},${idNumber},${result}\n`, 'utf8');
        }
        catch (error) {
            this.logger.error('Unable to write verification audit entry', error);
        }
        return employee ? { verified: true, employee } : { verified: false };
    }
    async loadEmployees() {
        const fileStat = await (0, promises_1.stat)(this.csvPath).catch((error) => {
            this.logger.error(`Unable to read employee CSV at ${this.csvPath}`, error.stack);
            throw new common_1.InternalServerErrorException('Employee records could not be loaded');
        });
        const updatedEmployees = new Map();
        await new Promise((resolve, reject) => {
            (0, node_fs_1.createReadStream)(this.csvPath)
                .pipe(csv())
                .on('data', (row) => {
                const employee = {
                    employeeId: row.employeeId?.trim(),
                    idNumber: row.idNumber?.trim(),
                    fullName: row.fullName?.trim(),
                    designation: row.designation?.trim(),
                    department: row.department?.trim(),
                    station: row.station?.trim(),
                    status: row.status?.trim(),
                };
                if (employee.idNumber) {
                    updatedEmployees.set(employee.idNumber, employee);
                }
            })
                .on('end', resolve)
                .on('error', reject);
        }).catch((error) => {
            this.logger.error(`Unable to load employee CSV at ${this.csvPath}`, error.stack);
            throw new common_1.InternalServerErrorException('Employee records could not be loaded');
        });
        this.employees = updatedEmployees;
        this.csvSignature = `${fileStat.mtimeMs}:${fileStat.ctimeMs}:${fileStat.size}:${fileStat.ino}`;
        this.logger.log(`Loaded ${this.employees.size} employee records`);
    }
    async refreshEmployeesIfChanged() {
        const fileStat = await (0, promises_1.stat)(this.csvPath).catch((error) => {
            this.logger.error(`Unable to check employee CSV at ${this.csvPath}`, error.stack);
            throw new common_1.InternalServerErrorException('Employee records could not be checked');
        });
        const signature = `${fileStat.mtimeMs}:${fileStat.ctimeMs}:${fileStat.size}:${fileStat.ino}`;
        if (signature !== this.csvSignature) {
            await this.loadEmployees();
        }
    }
    async prepareAuditLog() {
        await (0, promises_1.mkdir)((0, node_path_1.join)(process.cwd(), 'logs'), { recursive: true });
        try {
            await (0, promises_1.appendFile)(this.auditPath, 'timestamp,idNumber,result\n', {
                encoding: 'utf8',
                flag: 'wx',
            });
        }
        catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
        const contents = await (0, promises_1.readFile)(this.auditPath, 'utf8');
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
            if (separator < 0)
                continue;
            const timestamp = line.slice(0, separator);
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp))
                continue;
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime()))
                continue;
            lines[index] = `${this.formatEatTimestamp(date)}${line.slice(separator)}`;
            normalized = true;
        }
        if (normalized) {
            await (0, promises_1.writeFile)(this.auditPath, lines.join(lineEnding), 'utf8');
            this.logger.log('Normalized verification audit timestamps to EAT (UTC+3)');
        }
    }
    formatEatTimestamp(date) {
        const eatDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        const pad = (value) => String(value).padStart(2, '0');
        return `${eatDate.getUTCFullYear()}-${pad(eatDate.getUTCMonth() + 1)}-${pad(eatDate.getUTCDate())} ${pad(eatDate.getUTCHours())}:${pad(eatDate.getUTCMinutes())}:${pad(eatDate.getUTCSeconds())}`;
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = EmployeeService_1 = __decorate([
    (0, common_1.Injectable)()
], EmployeeService);
//# sourceMappingURL=employee.service.js.map