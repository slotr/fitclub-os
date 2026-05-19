/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  experimental: { typedRoutes: true },
  transpilePackages: ["@fitness/api", "@fitness/db"],
};

export default nextConfig;
