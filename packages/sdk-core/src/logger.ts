/**
 * Structured logging system with configurable log levels and sinks
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  traceId?: string;
}

export interface LogSink {
  write(log: StructuredLog): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  module?: string;
  sinks?: LogSink[];
  traceId?: string;
}

/**
 * Console sink - writes logs to browser console
 */
export class ConsoleSink implements LogSink {
  write(log: StructuredLog): void {
    const timestamp = new Date(log.timestamp).toISOString();
    const levelName = LogLevel[log.level];
    const formatted = `[${timestamp}] [${levelName}] [${log.module}] ${log.message}`;
    
    const consoleMethod = 
      log.level === LogLevel.DEBUG || log.level === LogLevel.INFO 
        ? 'log' 
        : log.level === LogLevel.WARN 
        ? 'warn' 
        : 'error';
    
    if (log.data && Object.keys(log.data).length > 0) {
      console[consoleMethod](formatted, log.data);
    } else {
      console[consoleMethod](formatted);
    }
  }
}

/**
 * HTTP sink - batches and sends logs to external service
 */
export class HttpSink implements LogSink {
  private endpoint: string;
  private batchSize: number;
  private flushInterval: number;
  private buffer: StructuredLog[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(endpoint: string, batchSize: number = 10, flushInterval: number = 5000) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startTimer();
  }

  write(log: StructuredLog): void {
    this.buffer.push(log);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private startTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
      this.startTimer();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
        credentials: 'same-origin',
      });
    } catch (error) {
      console.error('[DAP Overlay] Failed to send logs to HTTP sink:', error);
      // Don't re-add to buffer to avoid infinite retry loop
    }
  }

  /**
   * Force flush all buffered logs
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Cleanup timer
   */
  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Structured logger with configurable sinks and log levels
 */
export class Logger {
  private level: LogLevel;
  private module: string;
  private sinks: LogSink[];
  private traceId?: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.module = options.module ?? 'DAP-Overlay';
    this.sinks = options.sinks ?? [new ConsoleSink()];
    this.traceId = options.traceId;
  }

  /**
   * Update logger configuration
   */
  configure(options: Partial<LoggerOptions>): void {
    if (options.level !== undefined) this.level = options.level;
    if (options.module !== undefined) this.module = options.module;
    if (options.sinks !== undefined) this.sinks = options.sinks;
    if (options.traceId !== undefined) this.traceId = options.traceId;
  }

  /**
   * Add a sink to the logger
   */
  addSink(sink: LogSink): void {
    this.sinks.push(sink);
  }

  /**
   * Remove a sink from the logger
   */
  removeSink(sink: LogSink): void {
    const index = this.sinks.indexOf(sink);
    if (index > -1) {
      this.sinks.splice(index, 1);
    }
  }

  /**
   * Create a structured log entry
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.level) return;

    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
      traceId: this.traceId,
    };

    for (const sink of this.sinks) {
      try {
        sink.write(log);
      } catch (error) {
        console.error(`[DAP Overlay] Error writing to sink:`, error);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { 
          ...data, 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        }
      : { ...data, error };
    
    this.log(LogLevel.ERROR, message, errorData);
  }

  /**
   * Create a child logger with a different module name
   */
  child(module: string): Logger {
    return new Logger({
      level: this.level,
      module: `${this.module}:${module}`,
      sinks: this.sinks,
      traceId: this.traceId,
    });
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Get or create the global logger instance
 */
export function getLogger(options?: LoggerOptions): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(options);
  } else if (options) {
    globalLogger.configure(options);
  }
  return globalLogger;
}

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}
