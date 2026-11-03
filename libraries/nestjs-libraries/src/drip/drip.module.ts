import { Module } from '@nestjs/common';
import { DatabaseModule } from '@gitroom/nestjs-libraries/database/prisma/database.module';
import { DripService } from './drip.service';
import { DripController } from './drip.controller';

@Module({
  imports: [DatabaseModule],
  providers: [DripService],
  controllers: [DripController],
  exports: [DripService],
})
export class DripModule {}
