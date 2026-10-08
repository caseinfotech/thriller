declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ORGANIZER_EMAIL?: string;
    SITES_BACKEND?: boolean;
    BUCKET?: R2Bucket;
  }
}
