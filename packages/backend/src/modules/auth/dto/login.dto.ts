import {
  IsString,
  MaxLength,
  IsOptional,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'usernameOrPhoneRequired', async: false })
class UsernameOrPhoneRequired implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as Record<string, unknown>;
    return !!(obj.username || obj.phone);
  }

  defaultMessage(): string {
    return 'Username or phone is required';
  }
}

export class LoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @Validate(UsernameOrPhoneRequired)
  _trigger?: string;

  @IsString()
  @MaxLength(100)
  password: string;
}
