import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
 async headers(){return [{source:"/organizer/:path*",headers:[{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"},{key:"Cache-Control",value:"private, no-store"}]}];},
 webpack(config,{webpack}) {
  // Sites builds use the real Worker binding; Next builds use a server proxy.
  config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/,path.resolve(process.cwd(),"lib/vercel-env.ts")));
  return config;
 },
};
export default nextConfig;
