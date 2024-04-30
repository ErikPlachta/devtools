class CustomConsoleLogger {
    constructor() {
        this._logs = []; // Stores all captured logs
        this._originalConsole = { // Keeps original console methods
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        // Override console methods
        console.log = this.log.bind(this);
        console.info = this.info.bind(this);
        console.warn = this.warn.bind(this);
        console.error = this.error.bind(this);
    }

    log(...args) {
        this.captureLog('log', ...args);
        this._originalConsole.log.apply(console, args);
    }

    info(...args) {
        this.captureLog('info', ...args);
        this._originalConsole.info.apply(console, args);
    }

    warn(...args) {
        this.captureLog('warn', ...args);
        this._originalConsole.warn.apply(console, args);
    }

    error(...args) {
        this.captureLog('error', ...args);
        this._originalConsole.error.apply(console, args);
    }

    captureLog(method, ...args) {
        if (this.shouldLog(method, args)) {
            this._logs.push({
                method,
                timestamp: new Date(),
                data: args
            });
        }
    }

    shouldLog(method, args) {
        // Implement your conditional logic here
        // Example: Check data type, source file, etc.
        return true; // Placeholder, adjust based on actual conditions
    }

    getLogs() {
        return this._logs;
    }

    restoreConsole() {
        // Restore the original console methods
        console.log = this._originalConsole.log;
        console.info = this._originalConsole.info;
        console.warn = this._originalConsole.warn;
        console.error = this._originalConsole.error;
    }
}