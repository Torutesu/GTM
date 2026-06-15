import { IsString, IsOptional, IsObject } from 'class-validator';

export class ExecuteAgentDto {
  @IsString()
  agentType!: string;

  @IsObject()
  input!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  campaignId?: string;
}
