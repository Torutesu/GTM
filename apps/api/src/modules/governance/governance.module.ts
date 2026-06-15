import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { PolicyChecker } from './policy-checker';

@Module({
  controllers: [GovernanceController],
  providers: [GovernanceService, PolicyChecker],
  exports: [GovernanceService, PolicyChecker],
})
export class GovernanceModule {}
