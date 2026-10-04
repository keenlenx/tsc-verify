import { Body, Controller, Get, Post } from '@nestjs/common';
import { VerifyDto } from './dto/verify.dto';
import { EmployeeService } from './employee.service';

@Controller('api')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Post('verify')
  verify(@Body() body: VerifyDto) {
    return this.employeeService.verify(body.idNumber);
  }
}