const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001' ];

export function corsOrigins(): string[] {
  const configured = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    if (configured?.length) return configured;
    throw new Error('Configure CORS_ORIGIN with the frontend URL before starting the backend in production.');
  }

  return [...new Set([...localOrigins, ...(configured ?? [])])];
}
