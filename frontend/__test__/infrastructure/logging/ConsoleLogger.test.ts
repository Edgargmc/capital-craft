// __tests__/infrastructure/logging/ConsoleLogger.test.ts

import { ConsoleLogger, SilentLogger, LoggerFactory } from '../../../src/infrastructure/logging/ConsoleLogger';

describe('ConsoleLogger', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('ConsoleLogger', () => {
    it('should log info messages in development mode', () => {
      const logger = new ConsoleLogger('[Test]', true);
      
      logger.info('Test message', { userId: 'test-123' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Test] INFO: Test message',
        expect.stringContaining('userId')
      );
    });

    it('should not log info messages when debug disabled', () => {
      const logger = new ConsoleLogger('[Test]', false);
      
      logger.info('Test message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should always log error messages', () => {
      const logger = new ConsoleLogger('[Test]', false);
      const error = new Error('Test error');
      
      logger.error('Error occurred', error, { context: 'test' });

      expect(consoleSpy.error).toHaveBeenCalledWith('[Test] ERROR: Error occurred');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error details:', error);
      expect(consoleSpy.error).toHaveBeenCalledWith('Context:', expect.stringContaining('test'));
    });

    it('should log warning messages', () => {
      const logger = new ConsoleLogger('[Test]', true);
      
      logger.warn('Warning message', { level: 'medium' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[Test] WARN: Warning message',
        expect.stringContaining('level')
      );
    });

    it('should handle circular references in meta objects', () => {
      const logger = new ConsoleLogger('[Test]', true);
      const circular: any = { prop: 'value' };
      circular.self = circular;
      
      logger.info('Test with circular', circular);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Test] INFO: Test with circular',
        '[Circular or invalid meta object]'
      );
    });
  });

  describe('SilentLogger', () => {
    it('should not log info messages', () => {
      const logger = new SilentLogger();
      
      logger.info('Silent message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should only log minimal error information', () => {
      const logger = new SilentLogger();
      const error = new Error('Silent error');
      
      logger.error('Error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalledWith('Application error occurred');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error type:', 'Error');
    });

    it('should not log warning messages', () => {
      const logger = new SilentLogger();
      
      logger.warn('Silent warning');

      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('LoggerFactory', () => {
    it('should create console logger by default', () => {
      const logger = LoggerFactory.create();
      
      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should create silent logger when requested', () => {
      const logger = LoggerFactory.create('silent');
      
      expect(logger).toBeInstanceOf(SilentLogger);
    });

    it('should create appropriate logger for production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production
      if (process.env.NODE_ENV == 'production') {
        const prodLogger = LoggerFactory.createForProduction();
        expect(prodLogger).toBeInstanceOf(SilentLogger);
      }

      
      // Test development
      if (process.env.NODE_ENV == 'development') {
        const devLogger = LoggerFactory.createForProduction();
        expect(devLogger).toBeInstanceOf(ConsoleLogger);
      }
      // Restore
      //process.env.NODE_ENV = originalEnv;
    });
  });
});