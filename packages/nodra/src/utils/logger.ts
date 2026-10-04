/**
 * Nodra Framework - Logger
 *
 * Structured logger built on pino.
 * Supports child loggers for request-scoped context.
 */

import pino, { type DestinationStream, type LoggerOptions } from "pino";
import type { LoggingConfig } from "../core/config";

export type Logger = pino.Logger;

interface WritableStream {
  write(chunk: string): void;
}

export function createLogger(
  config: LoggingConfig,
  destination?: WritableStream,
): Logger {
  const options: LoggerOptions = {
    level: config.level,
  };

  if (destination) {
    return pino(options, destination as DestinationStream);
  }

  return pino(options);
}
