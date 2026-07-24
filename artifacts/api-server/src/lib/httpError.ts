/**
 * Throwable HTTP error — used to abort store transactions (updateApplication's
 * mutate callback) with a concrete status; the transaction rolls back and the
 * router maps it to a response.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
