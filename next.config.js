/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // pptxgenjs references Node built-ins via the `node:` scheme (guarded at
    // runtime); strip the scheme then stub the modules — the PowerPoint export
    // runs entirely client-side.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      https: false,
      os: false,
      path: false,
      'image-size': false,
    };
    return config;
  },
};

module.exports = nextConfig;
