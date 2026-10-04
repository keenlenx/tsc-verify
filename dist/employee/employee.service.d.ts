import { OnModuleInit } from '@nestjs/common';
export interface Employee {
    employeeId: string;
    idNumber: string;
    fullName: string;
    designation: string;
    department: string;
    station: string;
    status: string;
}
export declare class EmployeeService implements OnModuleInit {
    private readonly logger;
    private employees;
    private readonly csvPath;
    private readonly auditPath;
    private csvSignature;
    onModuleInit(): Promise<void>;
    verify(idNumber: string): Promise<{
        verified: true;
        employee: Employee;
    } | {
        verified: false;
    }>;
    private loadEmployees;
    private refreshEmployeesIfChanged;
    private prepareAuditLog;
    private formatEatTimestamp;
}
