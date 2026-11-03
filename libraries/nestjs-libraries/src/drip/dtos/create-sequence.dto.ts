import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSequenceDto {
  @ApiProperty({ description: 'Name of the drip sequence' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
