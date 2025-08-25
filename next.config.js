/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async redirects() {
        return [
            {
                source: '/',
                destination: '/products',
                permanent: false, // set true if you want 308 permanent
            },
        ];
    },
};
module.exports = nextConfig;