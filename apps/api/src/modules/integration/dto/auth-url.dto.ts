import { IsString } from 'class-validator';

export class GetAuthUrlDto {
  @IsString()
  platform!: string;

  @IsString()
  redirectUri!: string;
}

export class CallbackDto {
  @IsString()
  platform!: string;

  @IsString()
  code!: string;

  @IsString()
  state!: string;
}
