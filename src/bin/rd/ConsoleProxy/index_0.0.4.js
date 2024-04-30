/**
 * Manages console logging with enhanced features like log capture, rotation, and expiry.
 * Allows toggling of log capture and can restore original console methods.
 *
 * @class ConsoleManager
 * @param {Object} options - Configuration options for the logger.
 * @param {boolean} [options.log=true] - Enables capturing of console.log.
 * @param {boolean} [options.info=true] - Enables capturing of console.info.
 * @param {boolean} [options.warn=true] - Enables capturing of console.warn.
 * @param {boolean} [options.error=true] - Enables capturing of console.error.
 * @param {number} [options.maxLogSize=100] - Maximum number of log entries before rotation.
 * @param {number} [options.logExpiryDays=7] - Number of days to keep a log before expiry.
 * @param {boolean} [options.debug=false] - Optionally enable debug logging within class.
 * @version 0.0.3
 * @since 0.0.1
 */
class ConsoleManager {
    #defaultOptions = {
        log: true,
        info: true,
        warn: true,
        error: true,
        maxLogSize: 100,
        logExpiryDays: 7,
        debug: false
    };

    constructor(options = {}) {
        this._logs = [];
        this._originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };
        this._options = { ...this.#defaultOptions, ...options };
        this._enabled = true;
        this.init(this._options);
    }

    /**
     * Initializes logging based on the provided options, setting up console method overrides.
     * @param {Object} options - Configuration options.
     */
    init(options) {
        this.setOptions(options);
        this.toggleLogging(true);
    }

    /**
     * Updates the options for the logger, setting which console methods to override.
     * @param {Object} options - Options specifying which console methods to override.
     */
    setOptions(options) {
        Object.keys(options).forEach(key => {
            if (typeof this._originalConsole[key] === 'function') {
                console[key] = this._enabled ? this[`#private${key.charAt(0).toUpperCase() + key.slice(1)}`].bind(this) : this._originalConsole[key];
            }
        });
    }

    /**
     * Toggles the logging functionality on or off, restoring original console methods as needed.
     * @param {boolean} enable - If true, enables logging; if false, disables it.
     */
    toggleLogging(enable) {
        this._enabled = enable;
        Object.keys(this._originalConsole).forEach(key => {
            console[key] = enable ? this[`#private${key.charAt(0).toUpperCase() + key.slice(1)}`].bind(this) : this._originalConsole[key];
        });
    }

    /**
     * Captures logs, applying rotation and expiry checks before storing them.
     * @param {string} method - The console method that was called.
     * @param {Array} args - Arguments passed to the console method.
     */
    #captureLog(method, ...args) {
        if (this._options.debug) {
            this.original("log", `Capturing log: ${method}`, args);
        }
        this.#rotateLogs();
        const source = this.#getSource();
        const logEntry = {
            method,
            timestamp: new Date(),
            source,
            data: args
        };
        if (this.#shouldLog(method, args, source)) {
            this._logs.push(logEntry);
        }
    }

    /**
     * Manages log rotation based on configured size and expiry days.
     */
    #rotateLogs() {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - this._options.logExpiryDays);
        this._logs = this._logs.filter(log => new Date(log.timestamp) >= expiryDate);
        if (this._logs.length > this._options.maxLogSize) {
            this._logs.splice(0, this._logs.length - this._options.maxLogSize);
        }
    }

    /**
     * Retrieves the source file and line number from where the log was called using Error stack.
     * @returns {Object} - An object containing the source file and line number.
     */
    #getSource() {
        const stack = new Error().stack.split('\n')[3]; // Adjust based on actual usage
        const sourceMatch = /at (.+) \((.+):(\d+\)\s*$/.exec(stack);
        return sourceMatch ? { method: sourceMatch[1], file: sourceMatch[2], line: sourceMatch[3] } : { method: 'unknown', file: 'unknown', line: '0' };
    }

    /**
     * Decides whether a log should be captured based on method, arguments, and source.
     * @param {string} method - The console method used.
     * @param {Array} args - Arguments passed to the console method.
     * @param {Object} source - The source where the log call was made.
     * @returns {boolean} True if the log should be captured, false otherwise.
     */
    #shouldLog(method, args, source) {
        // Implement condition logic here. For now, we log everything.
        return true;
    }

    /**
     * Restores the original console methods, effectively disabling this custom logger.
     */
    restoreConsole() {
        this.toggleLogging(false);
    }

    /**
     * Retrieves all stored logs.
     * @returns {Array} An array of all logs captured.
     */
    getLogs() {
        return this._logs;
    }

    /**
     * Executes the original console method, bypassing the overridden methods.
     * @param {string} method - The console method type to execute (log, info, warn, error).
     * @param {...any} args - Arguments to pass to the original console method.
     */
    original(method, ...args) {
        if (typeof this._originalConsole[method] === 'function') {
            this._originalConsole[method].apply(console, args);
        }
    }
}

// Example of usage:
const logger = new ConsoleManager({ log: true, warn: true, debug: true });
console.log("This is a test log.");
const logs = logger.getLogs();
console.log(logs);
logger.restoreConsole();