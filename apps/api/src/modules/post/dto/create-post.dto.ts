import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsString()
  contentText!: string;

  @IsString()
  @IsIn(['X', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'THREADS'])
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
  @IsOptional()
  contentText?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}
