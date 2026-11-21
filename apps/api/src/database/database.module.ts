import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { db, pool } from './client.js';

export const DB = Symbol('DB');
/** The raw pg pool, for libraries that need a client rather than Drizzle. */
export const POOL = Symbol('POOL');

@Global()
@Module({
  providers: [
    { provide: DB, useValue: db },
    { provide: POOL, useValue: pool },
  ],
  exports: [DB, POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await pool.end();
  }
}
