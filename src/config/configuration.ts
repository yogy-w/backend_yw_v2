export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    env: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL ?? (() => { throw new Error('DATABASE_URL is not set'); })(),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
});
