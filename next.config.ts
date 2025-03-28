import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.xhscdn.com",
      },
      {
        protocol: "http",
        hostname: "**.xhscdn.com",
      },
      {
        protocol: "https",
        hostname: "api.hippyghosts.io",
      },
    ],
  },
  experimental: {
    // see https://nextjs.org/docs/app/api-reference/functions/forbidden
    authInterrupts: true,
    // 这个暂时不需要，通过 proxy 改写了 host 和 origin
    // serverActions: {
    //   allowedOrigins: process.env.SERVER_ACTIONS_ALLOWED_ORIGINS
    //     ? process.env.SERVER_ACTIONS_ALLOWED_ORIGINS.split(",")
    //     : [],
    // },
  },
  async rewrites() {
    return [
      {
        source: "/changelog.html",
        destination: "/_public/changelog.html",
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
