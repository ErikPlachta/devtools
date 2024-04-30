/**
 * Custom console logger class that can override console methods to capture, manage, and optionally send logs to a server.
 * It includes features for log rotation, expiry, and toggling logging functionality on and off.
 */
class CustomConsoleLogger {
    /**
     * Constructs the logger with options for which methods to capture and log management rules.
     * @param {Object} options - Configuration options for the logger.
     * @param {boolean} [options.log=true] - Enables capturing of console.log.
     * @param {boolean} [options.info=true] - Enables capturing of console.info.
     * @param {boolean} [options.warn=true] - Enables capturing of console.warn.
     * @param {boolean} [options.error=true] - Enables capturing of console.error.
     * @param {number} [options.maxLogSize=100] - Maximum number of log entries before rotation.
     * @param {number} [options.logExpiryDays=7] - Number of days to keep a log before expiry.
     */
    constructor(options = { log: true, info: true, warn: true, error: true, maxLogSize: 100, logExpiryDays: 7 }) {
        this._logs = [];
        this._originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };
        this._options = options;
        this._enabled = true;
        this.init(options);
    }

    /**
     * Initializes the logger by setting up console overrides based on provided options.
     * @param {Object} options - Options specifying which console methods to override.
     */
    init(options) {
        this.toggleLogging(true); // Enable logging by default
    }

    /**
     * Toggles the logging functionality on or off.
     * @param {boolean} enable - If true, enables logging; if false, disables it.
     */
    toggleLogging(enable) {
        if (enable && !this._enabled) {
            if (this._options.log) console.log = this.#privateLog.bind(this);
            if (this._options.info) console.info = this.#privateInfo.bind(this);
            if (this._options.warn) console.warn = this.#privateWarn.bind(this);
            if (this._options.error) console.error = this.#privateError.bind(this);
            this._enabled = true;
        } else if (!enable && this._enabled) {
            console.log = this._originalConsole.log;
            console.info = this._originalConsole.info;
            console.warn = this._originalConsole.warn;
            console.error = this._originalConsole.error;
            this._enabled = false;
        }
    }

    /**
     * Private method to handle log capture for console.log.
     * @param {...any} args - Arguments originally passed to console.log.
     */
    async #privateLog(...args) {
        await this.#captureLog('log', ...args);
        this._originalConsole.log.apply(console, args);
    }

    /**
     * Private method to handle log capture for console.info.
     * @param {...any} args - Arguments originally passed to console.info.
     */
    async #privateInfo(...args) {
        await this.#captureLog('info', ...args);
        this._originalConsole.info.apply(console, args);
    }

    /**
     * Private method to handle log capture for console.warn.
     * @param {...any} args - Arguments originally passed to console.warn.
     */
    async #privateWarn(...args) {
        await this.#captureLog('warn', ...args);
        this._originalConsole.warn.apply(console, args);
    }

    /**
     * Private method to handle log capture for console.error.
     * @param {...any} args - Arguments originally passed to console.error.
     */
    async #privateError(...args) {
        await this.#captureLog('error', ...args);
        this._originalConsole.error.apply(console, args);
    }

    /**
     * Captures and possibly sends log entries to a server based on the method called.
     * @param {string} method - The console method that was called.
     * @param {...any} args - The arguments passed to the console method.
     */
    async #captureLog(method, ...args) {
        this.#rotateLogs(); // Rotate logs if necessary before capturing new ones
        const source = this.#getSource();
        if (this.#shouldLog(method, args, source)) {
            const logEntry = {
                method,
                source,
                timestamp: new Date(),
                data: args
            };
            this._logs.push(logEntry);
        }
}

/**
 * Manages log rotation based on age and size limits specified in options.
 */
#rotateLogs() {
    const currentDate = new Date();
    this._logs = this._logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const ageInDays = (currentDate - logDate) / (1000 * 60 * 60 * 24);
        return ageInDays < this._options.logExpiryDays;
    });
    if (this._logs.length > this._options.maxLogSize) {
        this._logs.splice(0, this._logs.length - this._options.maxLogSize); // Keep only the newest logs
    }
}

/**
 * Extracts the source of the log call using stack trace information.
 * @returns {Object} Contains the method, file, and line number where the log was initiated.
 */
#getSource() {
    const err = new Error();
    const stack = err.stack.split('\n')[3]; // Adjust depending on the actual stack trace format
    const match = /at (.*?) $begin:math:text$?(.+?):(\\d+):\\d+$end:math:text$?$/.exec(stack);
    return match ? { method: match[1], file: match[2], line: match[3] } : {};
}

/**
 * Determines whether a log should be captured based on the method, arguments, and source.
 * @param {string} method - The console method used.
 * @param {Array} args - Arguments passed to the console method.
 * @param {Object} source - The source where the log call was made.
 * @returns {boolean} True if the log should be captured, false otherwise.
 */
#shouldLog(method, args, source) {
    return true; // Placeholder, adjust based on actual conditions
}

/**
 * Retrieves all stored logs.
 * @returns {Array} An array of all logs captured.
 */
getLogs() {
    return this._logs;
}

/**
 * Restores the original console methods, effectively disabling this custom logger.
 */
restoreConsole() {
    this.toggleLogging(false); // Disable logging and restore original console methods
}
}