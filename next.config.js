/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/sign-in", destination: "/api/auth/login", permanent: true },
      {
        source: "/sign-out",
        destination: "/api/auth/register",
        permanent: true,
      },
    ];
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias.encoding = false;
    config.resolve.alias.canvas = false;

    return config;
  },
};

module.exports = nextConfig;
