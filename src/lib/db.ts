import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  // Don't throw at import time to avoid crashing builds; API handlers will surface error
  console.warn('[db] MONGODB_URI is not set. Create .env.local with MONGODB_URI.');
}

let cached = (global as any)._mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');
    // Recommended settings for better perf and stability
    mongoose.set('strictQuery', true);
    cached!.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: false, // disable in production; indexes should be created explicitly
    }).then((m) => m);
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
