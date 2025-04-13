export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): Error => {
  if (error instanceof APIError) {
    return error;
  }
  if (error instanceof Error) {
    return new APIError(error.message);
  }
  return new APIError('An unknown error occurred');
};

export const rateLimiter = () => {
  const timestamps: number[] = [];
  const WINDOW_SIZE = 60000; // 1 minute
  const MAX_REQUESTS = 60; // 60 requests per minute

  return {
    checkRateLimit: () => {
      const now = Date.now();
      // Remove timestamps outside the window
      while (timestamps.length > 0 && timestamps[0] < now - WINDOW_SIZE) {
        timestamps.shift();
      }
      if (timestamps.length >= MAX_REQUESTS) {
        throw new APIError('Rate limit exceeded. Please try again later.', 429);
      }
      timestamps.push(now);
    }
  };
};