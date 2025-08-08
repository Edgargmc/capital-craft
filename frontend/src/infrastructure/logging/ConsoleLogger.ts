// src/infrastructure/logging/ConsoleLogger.ts
// Simple logger implementation for development

import { ILogger } from '../../use-cases/FetchNotifications';

export class ConsoleLogger implements ILogger {
  private readonly prefix: string;
  private readonly enableDebug: boolean;

  constructor(prefix = '[NotificationSystem]', enableDebug = process.env.NODE_ENV === 'development') {
    this.prefix = prefix;
    this.enableDebug = enableDebug;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.enableDebug) {
      console.log(`${this.prefix} INFO: ${message}`, meta ? this.formatMeta(meta) : '');
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`${this.prefix} ERROR: ${message}`);
    
    if (error) {
      console.error('Error details:', error);
      if (error.stack && this.enableDebug) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    if (meta) {
      console.error('Context:', this.formatMeta(meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`${this.prefix} WARN: ${message}`, meta ? this.formatMeta(meta) : '');
  }

  private formatMeta(meta: Record<string, unknown>): string {
    try {
      return JSON.stringify(meta, null, 2);
    } catch {
      return '[Circular or invalid meta object]';
    }
  }
}

// Production-ready logger that can be swapped in
export class SilentLogger implements ILogger {
  info(_message: string, _meta?: Record<string, unknown>): void {
    // No-op in production - should be completely silent
  }

  error(message: string, error?: Error, _meta?: Record<string, unknown>): void {
    // Only log errors in production, without sensitive data
    console.error('Application error occurred');
    if (error && error.message) {
      console.error('Error type:', error.name || 'Unknown');
    }
  }

  warn(_message: string, _meta?: Record<string, unknown>): void {
    // No-op in production - should be completely silent
  }
}

// Logger factory
export class LoggerFactory {
  static create(type: 'console' | 'silent' = 'console'): ILogger {
    switch (type) {
      case 'silent':
        return new SilentLogger();
      case 'console':
      default:
        return new ConsoleLogger();
    }
  }

  static createForProduction(): ILogger {
    return process.env.NODE_ENV === 'production' 
      ? new SilentLogger() 
      : new ConsoleLogger();
  }
}