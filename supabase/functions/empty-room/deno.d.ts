declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }
  export const env: Env;
}

// Declare module for Deno imports
declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.38.4' {
  export * from '@supabase/supabase-js';
}

// Add FormData.get() method for Deno
interface FormData {
  get(name: string): FormDataEntryValue | null;
}

// For response object properties
interface JobResponse {
  status: any;
  createdAt: any;
  updatedAt: any;
  originalUrl?: string;
  emptyUrl?: string;
  cleanUrl?: string;
  styledUrl?: string;
}