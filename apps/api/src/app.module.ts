import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { appConfig, validateConfig } from './config/app.config';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuditModule } from './core/audit/audit.module';
import { GlobalExceptionFilter } from './core/exceptions/global-exception.filter';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AssociationsModule } from './modules/associations/associations.module';
import { MembersModule } from './modules/members/members.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { SavingsModule } from './modules/savings/savings.module';
import { LoansModule } from './modules/loans/loans.module';
import { SanctionsModule } from './modules/sanctions/sanctions.module';
import { TontinesModule } from './modules/tontines/tontines.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { AdminModule } from './modules/admin/admin.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { BudgetModule } from './modules/budget/budget.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    AssociationsModule,
    MembersModule,
    TreasuryModule,
    SavingsModule,
    LoansModule,
    SanctionsModule,
    TontinesModule,
    MeetingsModule,
    AdminModule,
    GovernanceModule,
    BudgetModule,
    NotificationsModule,
    EquipmentModule,
    ContactModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
