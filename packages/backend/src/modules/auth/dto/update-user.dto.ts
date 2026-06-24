import { IsString, MaxLength, IsOptional, IsIn } from 'class-validator';
import { Role } from '../roles';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn([Role.ADMIN, Role.USER], { message: 'Can only set ADMIN or USER' })
  role?: string;
}
