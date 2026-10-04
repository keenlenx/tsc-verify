declare module 'csv-parser' {
  import { Transform } from 'node:stream';

  function csv(options?: Record<string, unknown>): Transform;
  export = csv;
}