import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AdminModule } from './admin/admin.module.js';
import { auth } from './auth/auth.js';
import { BroadcastsModule } from './broadcasts/broadcasts.module.js';
import { ChannelsModule } from './channels/channels.module.js';
import { ComplianceModule } from './compliance/compliance.module.js';
import { DatabaseModule } from './database/database.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { GeoModule } from './geo/geo.module.js';
import { HealthModule } from './health/health.module.js';
import { InfoModule } from './info/info.module.js';
import { IntakeModule } from './intake/intake.module.js';
import { MapModule } from './map/map.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
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
    BroadcastsModule,
    GeoModule,
    ChannelsModule,
    IntakeModule,
    ResidentsModule,
    TriageModule,
    FeedbackModule,
    InfoModule,
    MapModule,
    MessagingModule,
    ComplianceModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
