class CustomConsoleLogger {
    constructor(options = { log: true, info: true, warn: true, error: true }) {
        this._logs = [];
        this._originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        this.init(options);
    }

    init(options) {
        if (options.log) console.log = this.#privateLog.bind(this);
        if (options.info) console.info = this.#privateInfo.bind(this);
        if (options.warn) console.warn = this.#privateWarn.bind(this);
        if (options.error) console.error = this.#privateError.bind(this);
    }

    #privateLog(...args) {
        this.#captureLog('log', ...args);
        this._originalConsole.log.apply(console, args);
    }

    #privateInfo(...args) {
        this.#captureLog('info', ...args);
        this._originalConsole.info.apply(console, args);
    }

    #privateWarn(...args) {
        this.#captureLog('warn', ...args);
        this._originalConsole.warn.apply(console, args);
    }

    #privateError(...args) {
        this.#captureLog('error', ...args);
        this._originalConsole.error.apply(console, args);
    }

    #captureLog(method, ...args) {
        const source = this.#getSource();
        if (this.#shouldLog(method, args, source)) {
            this._logs.push({
                method,
                source,
                timestamp: new Date(),
                data: args
            });
        }
    }

    #getSource() {
        const err = new Error();
        const stack = err.stack.split('\n')[3]; // Adjust depending on the actual stack trace format
        return stack; // Could be further parsed to extract only relevant parts
    }

    #shouldLog(method, args, source) {
        // Implement your conditional logic here
        return true; // Placeholder, adjust based on actual conditions
    }

    getLogs() {
        return this._logs;
    }

    restoreConsole() {
        console.log = this._originalConsole.log;
        console.info = this._originalConsole.info;
        console.warn = this._originalConsole.warn;
        console.error = this._originalConsole.error;
    }
}