import pino, { type DestinationStream, type LoggerOptions } from "pino";
import pretty from "pino-pretty";

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

  if (config.format === "pretty") {
    return pino(
      options,
      pretty({
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      }),
    );
  }

  return pino(options);
}
