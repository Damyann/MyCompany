/** @type {import('next').NextConfig} */
const nextConfig={
  allowedDevOrigins:['waytoschedule.com','*.waytoschedule.com','localhost','127.0.0.1'],
  experimental:{serverActions:{allowedOrigins:['waytoschedule.com','*.waytoschedule.com','localhost','127.0.0.1']}}
};
export default nextConfig;
