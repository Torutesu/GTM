import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(280)
  contentText!: string;

  @IsString()
  @IsIn(['X', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN'])
  platform!: string;

  @IsString()
  @IsOptional()
  integrationAccountId?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}

export class UpdatePostDto {
  @IsString()
  @MaxLength(280)
  @IsOptional()
  contentText?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}
