import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_SECRET') ?? 'dev-secret',
        signOptions: {
          expiresIn: (config.get<string>('ACCESS_EXPIRES') ?? '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
