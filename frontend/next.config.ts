import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests in development from local network IPs
  allowedDevOrigins: [
    '192.168.1.77',   // Desktop/laptop IP
    '192.168.1.1',    // Router
    '192.168.1.100',  // Common device range
    '192.168.1.101',
    '192.168.1.102',
    '192.168.1.103',
    '192.168.1.104',
    '192.168.1.105',  // Mobile devices usually get IPs in this range
    '127.0.0.1',      // Localhost
    'localhost'       // Localhost hostname
  ]
};

export default nextConfig;
