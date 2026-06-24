import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, Matches } from 'class-validator';
import { Role } from '../roles';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z]/, { message: 'Username must start with a letter' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([Role.ADMIN, Role.USER], { message: 'Can only create ADMIN or USER' })
  role: string;
}
