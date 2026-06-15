import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'SUPABASE_URL',
      useValue: process.env.SUPABASE_URL || '',
    },
    {
      provide: 'SUPABASE_ANON_KEY',
      useValue: process.env.SUPABASE_ANON_KEY || '',
    },
    {
      provide: 'JWT_SECRET',
      useValue: process.env.JWT_SECRET || 'gon-dev-secret-do-not-use-in-prod',
    },
    {
      provide: 'OPENAI_API_KEY',
      useValue: process.env.OPENAI_API_KEY || '',
    },
    {
      provide: 'TOKEN_ENCRYPTION_KEY',
      useValue: process.env.TOKEN_ENCRYPTION_KEY || '',
    },
  ],
  exports: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'TOKEN_ENCRYPTION_KEY',
  ],
})
export class ConfigModule {}
