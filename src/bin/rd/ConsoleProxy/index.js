/**
 * Manages console logging with features like log capture, rotation, and expiry.
 * Allows toggling of log capture and can restore original console methods.
 * Includes debugging options to facilitate development and maintenance.
 *
 * @class ConsoleProxy
 * @param {Object} options - Configuration options for the logger.
 * @param {boolean} [options.log=true] - Enables capturing of console.log.
 * @param {boolean} [options.info=true] - Enables capturing of console.info.
 * @param {boolean} [options.warn=true] - Enables capturing of console.warn.
 * @param {boolean} [options.error=true] - Enables capturing of console.error.
 * @param {number} [options.maxLogSize=100] - Maximum number of log entries before rotation.
 * @param {number} [options.logExpiryDays=7] - Number of days to keep a log before expiry.
 * @param {boolean} [options.debug=false] - Optionally enable debug logging within class.
 *
 * @version 0.0.5
 * @since 0.0.1
 */
class ConsoleProxy {
  // Placeholder, to be set by init -> #initializeMethods
  #privateMethods = {};

  constructor(options = {}) {
    this._logs = [];
    this._originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    this._options = { ...this.defaultOptions(), ...options };
    this._enabled = true;
    this.init(this._options);
  }

  //----------------------------------------------------------------------------
  // Public Methods

  /**
   * Initializes logging based on the provided options, setting up console method overrides.
   * @param {Object} options - Configuration options.
   */
  init(options) {
    try {
      this.#initializeMethods();
      this.setOptions(options);
      this.toggleProxy(true);
      return true;
    } catch (error) {
      this.original("error", error);
      return false;
    }
  }

  /**
   * Default configuration for the proxy.
   * @returns {Object} Default settings for logging options.
   */
  defaultOptions() {
    return {
      log: true,
      info: true,
      warn: true,
      error: true,
      maxLogSize: 100,
      logExpiryDays: 7,
      debug: false,
    };
  }

  /**
   * Updates the options for the logger, setting which console methods to override.
   * @param {Object} options - Options specifying which console methods to override.
   */
  setOptions(options) {
    Object.keys(this._originalConsole).forEach((key) => {
      if (options[key] !== undefined) {
        console[key] = this._enabled
          ? this.#privateMethods[key]
          : this._originalConsole[key];
      }
    });
  }

  /**
   * Toggles the logging functionality on or off, restoring original console methods as needed.
   * @param {boolean} enable - If true, enables logging; if false, disables it.
   */
  toggleProxy(enable) {
    this._enabled = enable;
    Object.keys(this._originalConsole).forEach((key) => {
      console[key] = enable
        ? this.#privateMethods[key]
        : this._originalConsole[key];
    });
  }

  /**
   * Restores the original console methods, effectively disabling this custom logger.
   */
  disableProxy() {
    this.toggleProxy(false);
  }

  /**
   * Retrieves all stored logs.
   * @returns {Array} An array of all logs captured.
   */
  getLogs() {
    let logs = {};
    this._logs.forEach((record) => {
      if (typeof record.source === "string" && record.source.length > 0) {
        if (!logs[record.source]) {
          logs[record.source] = {
            source: record.source,
            logs: [record],
          };
        } else {
          logs[record.source].logs.push(record);
        }
      }

      logs[record.source];
    });
    //return this._logs;
    return logs;
  }

  /**
   * Retrieves all options from current state.
   * @returns {Object} An object of all options and their current state.
   */
  getOptions() {
    return this._options;
  }

  /**
   * Executes the original console method, bypassing the overridden methods.
   * @param {string} method - The console method type to execute (log, info, warn, error).
   * @param {...any} args - Arguments to pass to the original console method.
   */
  original(method, ...args) {
    if (typeof this._originalConsole[method] === "function") {
      this._originalConsole[method].apply(console, args);
    }
  }

  //----------------------------------------------------------------------------
  // Private Methods

  /**
   * Initializes and binds private logging methods to ensure correct 'this' context.
   */
  #initializeMethods() {
    this.#privateMethods = {
      log: this.#log.bind(this),
      info: this.#info.bind(this),
      warn: this.#warn.bind(this),
      error: this.#error.bind(this),
    };
  }

  // Private methods to handle log capture for each console method.
  #log(...args) {
    this.#captureLog("log", ...args);
    this._originalConsole.log(...args);
  }

  #info(...args) {
    this.#captureLog("info", ...args);
    this._originalConsole.info(...args);
  }

  #warn(...args) {
    this.#captureLog("warn", ...args);
    this._originalConsole.warn(...args);
  }

  #error(...args) {
    this.#captureLog("error", ...args);
    this._originalConsole.error(...args);
  }

  /**
   * Captures logs, applying rotation and expiry checks before storing them.
   * @param {string} method - The console method that was called.
   * @param {Array} args - Arguments passed to the console method.
   */
  #captureLog(method, ...args) {
    if (this._options.debug) {
      this.original("log", `Debug: Capturing log: ${method}`, args);
    }
    this.#rotateLogs();
    const source = this.#getSource(args);
    const logEntry = {
      method,
      source,
      timestamp: new Date(),
      data: args,
    };
    if (this.#shouldLog(method, args)) {
      this._logs.push(logEntry);
    }
  }

  /**
   * Manages log rotation based on configured size and expiry days.
   */
  #rotateLogs() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - this._options.logExpiryDays);
    this._logs = this._logs.filter(
      (log) => new Date(log.timestamp) >= expiryDate
    );
    if (this._logs.length > this._options.maxLogSize) {
      this._logs.splice(0, this._logs.length - this._options.maxLogSize);
    }
  }

  /**
   * Retrieves the source file and line number from where the log was called using Error stack.
   * @returns {Object} - An object containing the source file and line number.
   */
  #getSource(args = []) {
    if (this._options.debug === true) {
      this.original("log", [
        "[#getSource][options.debug===true] - args: ",
        args,
      ]);
    }

    // This is getting from the source code passed into args, and the ideal way to get source.
    if (typeof args?.[0] === "string") {
      // Single entry means manual entry within DevTools
      if (args.length === 1) {
        return "user";
      }
      // Otherwise, executed by code somewhere within session so get info accordingly.
      else {
        let _fullLine =
          args[0]?.split(" ")?.[2]?.replace("[", "")?.replace("]", "") || "";
        let _name = _fullLine?.split(":")?.[0];
        return _name;
      }
    }
    // Otherwise, unknown
    else {
      return undefined;
    }
  }

  /**
   * Decides whether a log should be captured based on the console method used.
   * @param {string} method - The console method used.
   * @param {Array} args - Arguments passed to the console method.
   * @returns {boolean} True if the log should be captured, false otherwise.
   */
  #shouldLog(method, args) {
    return this._options[method];
  }
}

// Example of usage
const logger = new ConsoleProxy({
  log: true,
  info: true,
  warn: false,
  error: false,
  debug: false,
});

/** -- Run Test (Toggle this line to execute below testing logic. )
  console.log("This is a log test.");
  console.info("This is an info test.");
  console.warn("This is a warn test not captured.");
  console.error("This is an error test not captured.");

  const logs = logger.getLogs();
  logger.disableProxy();
  console.log("Captured logs: ", logs);
//**/