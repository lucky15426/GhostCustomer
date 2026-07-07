/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the demo to build even if a stray type/lint slips through during a hackathon crunch.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() {
    // Optionally proxy /py/* to the Python FastAPI + LangGraph engine when configured.
    const py = process.env.PYTHON_ENGINE_URL;
    if (!py) return [];
    return [{ source: "/py/:path*", destination: `${py}/:path*` }];
  },
};

export default nextConfig;
