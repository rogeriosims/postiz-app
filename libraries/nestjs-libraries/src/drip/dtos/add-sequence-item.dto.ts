import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSequenceItemDto {
  @ApiProperty({ description: 'Day of the sequence' })
  @IsInt()
  @IsNotEmpty()
  day: number;

  @ApiProperty({ description: 'Content of the sequence item' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  @IsString()
  @IsOptional()
  media?: string;
}
