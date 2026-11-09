import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollSubscriberDto {
  @ApiPropertyOptional({ description: 'Chat ID of the subscriber' })
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiPropertyOptional({ description: 'Email/Identifier alias for chatId' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'ID of the sequence to enroll in' })
  @IsString()
  @IsNotEmpty()
  sequenceId: string;
}
