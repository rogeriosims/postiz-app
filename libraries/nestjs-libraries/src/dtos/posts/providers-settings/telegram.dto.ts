import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TelegramDto {
  @IsBoolean()
  @IsOptional()
  protect_content?: boolean;

  @IsBoolean()
  @IsOptional()
  has_spoiler?: boolean;

  @IsString()
  @IsOptional()
  button_text?: string;

  @IsString()
  @IsOptional()
  button_url?: string;
}
