import { OnModuleInit } from '@nestjs/common';
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
export declare class EmployeeService implements OnModuleInit {
    private readonly logger;
    private teachers;
    private readonly csvPath;
    private readonly auditPath;
    private csvSignature;
    onModuleInit(): Promise<void>;
    verify(idNumber: string): Promise<{
        verified: true;
        teacher: Teacher;
    } | {
        verified: false;
    }>;
    private loadEmployees;
    private refreshTeachersIfChanged;
    private prepareAuditLog;
    private formatEatTimestamp;
}
