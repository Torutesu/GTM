import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsObject()
  @IsOptional()
  kpiTargets?: Record<string, number>;
}
