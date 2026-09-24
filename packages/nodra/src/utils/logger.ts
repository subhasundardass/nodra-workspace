/**
 * Nodra Framework - Logger
 *
 * Structured logger built on pino.
 *
 * Supports:
 * - JSON logging
 * - Pretty development logging
 * - Custom destinations
 * - Child loggers
 */

import pino, { type DestinationStream, type LoggerOptions } from "pino";
import pretty from "pino-pretty";

import type { LoggingConfig } from "../core/config.js";

export type Logger = pino.Logger;

interface PrettyOptions {
  colorize: boolean;
  translateTime: string;
  ignore: string;
}

/**
 * Default pretty logger options.
 */
const PRETTY_OPTIONS = {
  colorize: true,
  translateTime: "HH:MM:ss",
  ignore: "pid,hostname",
  levelFirst: true,
  singleLine: true,
};

/**
 * Creates a configured Nodra logger.
 *
 * Logging modes:
 *
 *   JSON
 *     pino(options)               -> stdout
 *     pino(options, destination)  -> custom stream
 *
 *   Pretty
 *     pino(options, prettyStream) -> pretty stream, optionally piped
 *
 * We intentionally use pino-pretty as a stream instead of Pino's
 * transport mechanism. This avoids transport-worker module resolution
 * problems when Nodra runs through Vite / TanStack Start SSR.
 */
export function createLogger(
  config: LoggingConfig,
  destination?: DestinationStream,
): Logger {
  const options: LoggerOptions = {
    level: config.level,
  };

  if (config.format === "pretty") {
    const prettyStream = pretty(PRETTY_OPTIONS);

    if (destination) {
      prettyStream.pipe(destination as NodeJS.WritableStream);
    }

    return pino(options, prettyStream);
  }

  if (destination) {
    return pino(options, destination);
  }

  return pino(options);
}

/**
 * Creates a child logger with bound context.
 *
 * Useful for request-scoped logging such as:
 *
 * - requestId
 * - userId
 * - document
 * - doctype
 * - branch
 */
export function createChildLogger(
  parent: Logger,
  bindings: Record<string, unknown>,
): Logger {
  return parent.child(bindings);
}
