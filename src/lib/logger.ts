// Production-ready logging utility
// Replaces console.log statements with environment-aware logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      // Add user context if available
      userId: typeof window !== 'undefined' ? 
        localStorage.getItem('user-id') || undefined : undefined,
      sessionId: typeof window !== 'undefined' ? 
        sessionStorage.getItem('session-id') || undefined : undefined,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true;
    
    // Only log debug/info in development
    return this.isDevelopment;
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    return `${prefix} ${entry.message}`;
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, data);
    console.log(this.formatMessage(entry), data || '');
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, data);
    console.info(this.formatMessage(entry), data || '');
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, data);
    console.warn(this.formatMessage(entry), data || '');
    
    // In production, could send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  error(message: string, error?: Error | any): void {
    const entry = this.createLogEntry('error', message, {
      error: error?.message || error,
      stack: error?.stack,
    });
    
    console.error(this.formatMessage(entry), error || '');
    
    // In production, always send errors to monitoring
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  // API-specific logging
  apiRequest(method: string, url: string, headers?: any): void {
    this.debug(`API ${method} ${url}`, { headers });
  }

  apiResponse(status: number, url: string, data?: any): void {
    if (status >= 400) {
      this.error(`API Error ${status} for ${url}`, data);
    } else {
      this.debug(`API Success ${status} for ${url}`);
    }
  }

  // User action logging
  userAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data);
  }

  // Performance logging
  performance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`Performance: ${operation} completed in ${duration}ms`);
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // In production, this would send to services like:
    // - Sentry for error tracking
    // - LogRocket for user sessions
    // - DataDog for application monitoring
    // - Custom analytics endpoint
    
    try {
      if (typeof window !== 'undefined' && fetch) {
        // Example: Send to monitoring endpoint
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Silent failure - don't break app if monitoring is down
        });
      }
    } catch {
      // Silent failure
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common use cases
export const logApiRequest = (method: string, url: string, headers?: any) => 
  logger.apiRequest(method, url, headers);

export const logApiResponse = (status: number, url: string, data?: any) => 
  logger.apiResponse(status, url, data);

export const logUserAction = (action: string, data?: any) => 
  logger.userAction(action, data);

export const logError = (message: string, error?: Error | any) => 
  logger.error(message, error);

export const logWarning = (message: string, data?: any) => 
  logger.warn(message, data);

export const logInfo = (message: string, data?: any) => 
  logger.info(message, data);

export const logDebug = (message: string, data?: any) => 
  logger.debug(message, data);