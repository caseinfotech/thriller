import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
 webpack(config,{webpack}) {
  // Sites builds use the real Worker binding; Next builds use a server proxy.
  config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/,path.resolve(process.cwd(),"lib/vercel-env.ts")));
  return config;
 },
};
export default nextConfig;
