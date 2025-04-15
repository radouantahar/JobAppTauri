declare module 'vitest' {
  interface Mock<T = unknown, Y extends unknown[] = unknown[]> {
    mockResolvedValueOnce(value: T): this;
    mockRejectedValueOnce(error: Error): this;
    mockImplementation(fn: (...args: Y) => T): this;
  }
} 