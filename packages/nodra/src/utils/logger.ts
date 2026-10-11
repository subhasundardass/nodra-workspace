<<<<<<< HEAD
/**
 * Nodra Framework - Logger
 *
 * Structured logger built on pino.
 * Supports child loggers for request-scoped context.
 */

import pino, { type DestinationStream, type LoggerOptions } from "pino";
=======
import pino, { type DestinationStream, type LoggerOptions } from "pino";
import pretty from "pino-pretty";

>>>>>>> origin/core
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
<<<<<<< HEAD
=======
  }

  if (config.format === "pretty") {
    return pino(
      options,
      pretty({
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      }),
    );
>>>>>>> origin/core
  }

  return pino(options);
}
