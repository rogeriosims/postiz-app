import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollSubscriberDto {
  @ApiProperty({ description: 'Chat ID of the subscriber' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'ID of the sequence to enroll in' })
  @IsString()
  @IsNotEmpty()
  sequenceId: string;
}
