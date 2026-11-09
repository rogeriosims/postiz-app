import { IsString, IsInt, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSequenceItemDto {
  @ApiPropertyOptional({ description: 'ID of the sequence item if updating' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Day of the sequence' })
  @IsInt()
  @IsNotEmpty()
  day: number;

  @ApiPropertyOptional({ description: 'Content of the sequence item' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Message alias for content' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  @IsString()
  @IsOptional()
  media?: string;

  @ApiPropertyOptional({ description: 'Media URL alias' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Spoiler / blur on photo or video' })
  @IsBoolean()
  @IsOptional()
  hasSpoiler?: boolean;

  @ApiPropertyOptional({ description: 'Protect content (anti-leak / no forward / no save)' })
  @IsBoolean()
  @IsOptional()
  protectContent?: boolean;

  @ApiPropertyOptional({ description: 'Inline button text' })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiPropertyOptional({ description: 'Inline button URL' })
  @IsString()
  @IsOptional()
  buttonUrl?: string;
}
