import { VerifyDto } from './dto/verify.dto';
import { EmployeeService } from './employee.service';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    health(): {
        ok: boolean;
    };
    verify(body: VerifyDto): Promise<{
        verified: true;
        employee: import("./employee.service").Employee;
    } | {
        verified: false;
    }>;
}
