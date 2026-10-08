declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ORGANIZER_EMAIL?: string;
    SITES_BACKEND?: boolean;
    ORGANIZER_ACCESS_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
