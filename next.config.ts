/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Configuration du Turbopack avec les options recommandées
    turbo:
      process.env.NODE_ENV === "development"
        ? {
            rules: {
              // Configurations spécifiques de Turbopack si nécessaire
            },
          }
        : undefined,
  },
};

export default nextConfig;
