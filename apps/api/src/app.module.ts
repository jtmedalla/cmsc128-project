import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { auth } from './auth/auth.js';
import { BroadcastModule } from './broadcast/broadcast.module.js';
import { ChannelsModule } from './channels/channels.module.js';
import { DatabaseModule } from './database/database.module.js';
import { GeoModule } from './geo/geo.module.js';
import { HealthModule } from './health/health.module.js';
import { IntakeModule } from './intake/intake.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { ResidentsModule } from './residents/residents.module.js';
import { TriageModule } from './triage/triage.module.js';

@Module({
  imports: [
    DatabaseModule,
    // Raw bodies let webhooks verify signatures.
    AuthModule.forRoot({ auth, bodyParser: { rawBody: true } }),
    HealthModule,
    RealtimeModule,
    BroadcastModule,
    GeoModule,
    ChannelsModule,
    IntakeModule,
    ResidentsModule,
    TriageModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
