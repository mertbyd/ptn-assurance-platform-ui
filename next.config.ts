import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/api", destination: "/api-contract/sources", permanent: false },
      { source: "/api-contract", destination: "/api-contract/sources", permanent: false },
      { source: "/db", destination: "/database/connections", permanent: false },
      { source: "/database", destination: "/database/connections", permanent: false },
    ];
  },
};

export default nextConfig;
