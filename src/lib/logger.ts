/**
 * Enterprise-grade structured logger for Kivora.
 * Centralizes logging and prepares integration with external services like Sentry or LogSnag.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private isSentryInitialized: boolean = false;

  private constructor() {
    // In a real enterprise app, we would initialize Sentry here
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) { ... }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async log(entry: LogEntry) {
    const { level, message, context, timestamp } = entry;
    
    // 1. Local development logging
    if (process.env.NODE_ENV === 'development') {
      const color = level === 'security' ? '\x1b[35m' : level === 'error' ? '\x1b[31m' : '\x1b[33m';
      console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${timestamp} - ${message}`, context || '');
    }

    // 2. Security Alerts (Critical for "Mini Hackers" detection)
    if (level === 'security' || level === 'error') {
      // Here we would send to Sentry or LogSnag
      // Sentry.captureMessage(message, { level: 'error', extra: context });
      
      // For now, we log to a special "security" audit trail in the DB if needed
      // or just ensure it's captured in the server logs.
      if (process.env.NODE_ENV === 'production') {
        console.error(`SECURITY_ALERT: ${message}`, JSON.stringify(context));
      }
    }
  }

  public info(message: string, context?: Record<string, any>) {
    this.log({ level: 'info', message, context, timestamp: new Date().toISOString() });
  }

  public warn(message: string, context?: Record<string, any>) {
    this.log({ level: 'warn', message, context, timestamp: new Date().toISOString() });
  }

  public error(message: string, context?: Record<string, any>) {
    this.log({ level: 'error', message, context, timestamp: new Date().toISOString() });
  }

  /**
   * Specifically for tracking potential attacks or security violations.
   */
  public security(message: string, context?: Record<string, any>) {
    this.log({ level: 'security', message, context, timestamp: new Date().toISOString() });
  }
}

export const logger = Logger.getInstance();
