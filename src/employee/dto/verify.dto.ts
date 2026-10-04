import { IsString, Matches } from 'class-validator';

export class VerifyDto {
  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: 'idNumber must contain 7 or 8 digits',
  })
  idNumber!: string;
}