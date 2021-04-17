'use strict';

var electron = require('electron');
var net = require('net');
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var util = require('util');
var os = require('os');

var extensions = "F:\ElectronProject\charge-client\extensions";

electron.ipcMain.handle("dialog:showCertificateTrustDialog", (event, ...args) => {
  return electron.dialog.showCertificateTrustDialog(args[0]);
});
electron.ipcMain.handle("dialog:showErrorBox", (event, ...args) => {
  return electron.dialog.showErrorBox(args[0], args[1]);
});
electron.ipcMain.handle("dialog:showMessageBox", (event, ...args) => {
  return electron.dialog.showMessageBox(args[0]);
});
electron.ipcMain.handle("dialog:showOpenDialog", (event, ...args) => {
  return electron.dialog.showOpenDialog(args[0]);
});
electron.ipcMain.handle("dialog:showSaveDialog", (event, ...args) => {
  return electron.dialog.showSaveDialog(args[0]);
});

function formatMsg(message, options) {
  return options.length !== 0 ? util.format(message, options) : util.format(message);
}
function baseTransform(tag) {
  return new stream.Transform({transform(c, e, cb) {
    cb(void 0, `[${tag}] [${new Date().toLocaleString()}] ${c}
`);
  }});
}
class Logger {
  constructor() {
    this.loggerEntries = {log: baseTransform("INFO"), warn: baseTransform("WARN"), error: baseTransform("ERROR")};
    this.log = (message, ...options) => {
      this.loggerEntries.log.write(formatMsg(message, options));
    };
    this.warn = (message, ...options) => {
      this.loggerEntries.warn.write(formatMsg(message, options));
    };
    this.error = (message, ...options) => {
      this.loggerEntries.error.write(formatMsg(message, options));
    };
    this.output = new stream.PassThrough();
    this.logDirectory = "";
    stream.pipeline(this.loggerEntries.log, this.output, () => {
    });
    stream.pipeline(this.loggerEntries.warn, this.output, () => {
    });
    stream.pipeline(this.loggerEntries.error, this.output, () => {
    });
    process.on("uncaughtException", (err) => {
      this.error("Uncaught Exception");
      this.error(err);
    });
    process.on("unhandledRejection", (reason) => {
      this.error("Uncaught Rejection");
      this.error(reason);
    });
    if (process.env.NODE_ENV === "development") {
      this.output.on("data", (b) => {
        console.log(b.toString());
      });
    }
    electron.app.once("browser-window-created", (event, window) => {
      this.captureWindowLog(window);
    });
  }
  async initialize(directory) {
    this.logDirectory = directory;
    const mainLog = path.join(directory, "main.log");
    const stream = fs.createWriteStream(mainLog, {encoding: "utf-8", flags: "w+"});
    this.output.pipe(stream);
    this.log(`Setup main logger to ${mainLog}`);
  }
  captureWindowLog(window, name) {
    name = name ?? window.webContents.id.toString();
    if (!this.logDirectory) {
      this.warn(`Cannot capture window log for window ${name}. Please initialize the logger to set logger directory!`);
      return;
    }
    const loggerPath = path.resolve(this.logDirectory, `renderer.${name}.log`);
    this.log(`Setup renderer logger for window ${name} to ${loggerPath}`);
    const stream = fs.createWriteStream(loggerPath, {encoding: "utf-8", flags: "w+"});
    const levels = ["INFO", "WARN", "ERROR"];
    window.webContents.on("console-message", (e, level, message, line, id) => {
      stream.write(`[${levels[level]}] [${new Date().toUTCString()}] [${id}]: ${message}
`);
    });
    window.once("close", () => {
      window.webContents.removeAllListeners("console-message");
      stream.close();
    });
  }
  createLoggerFor(tag) {
    function transform(tag2) {
      return new stream.Transform({transform(c, e, cb) {
        cb(void 0, `[${tag2}] ${c}
`);
      }});
    }
    const log = transform(tag).pipe(this.loggerEntries.log);
    const warn = transform(tag).pipe(this.loggerEntries.warn);
    const error = transform(tag).pipe(this.loggerEntries.error);
    return {
      log(message, ...options) {
        log.write(formatMsg(message, options));
      },
      warn(message, ...options) {
        warn.write(formatMsg(message, options));
      },
      error(message, ...options) {
        error.write(formatMsg(message, options));
      }
    };
  }
}

const INJECTIONS_SYMBOL = Symbol("__injections__");
function Inject(type) {
  return function(target, propertyKey) {
    if (!Reflect.has(target, INJECTIONS_SYMBOL)) {
      Reflect.set(target, INJECTIONS_SYMBOL, []);
    }
    if (!type) {
      throw new Error(`Inject recieved type: ${type}!`);
    } else {
      Reflect.get(target, INJECTIONS_SYMBOL).push({type, field: propertyKey});
    }
  };
}
class Service {
  constructor(logger) {
    this.name = Object.getPrototypeOf(this).constructor.name;
    this.logger = logger.createLoggerFor(this.name);
  }
  log(m, ...a) {
    this.logger.log(`[${this.name}] ${m}`, ...a);
  }
  error(m, ...a) {
    this.logger.error(`[${this.name}] ${m}`, ...a);
  }
  warn(m, ...a) {
    this.logger.warn(`[${this.name}] ${m}`, ...a);
  }
}

class BaseService extends Service {
  async getBasicInformation() {
    this.log("getBasicInformation is called!");
    const result = {
      platform: os.platform(),
      version: electron.app.getVersion(),
      root: electron.app.getPath("userData")
    };
    return result;
  }
}

function add(a, b) {
  return a + b;
}

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorate = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
class FooService extends Service {
  async foo() {
    const result = await this.baseService.getBasicInformation();
    const sum = add(1, 2);
    this.log(`Call function imported from /shared folder! 1 + 2 = ${sum}`);
    return {
      ...result,
      foo: "bar"
    };
  }
}
__decorate([
  Inject("BaseService")
], FooService.prototype, "baseService", 2);

let _services;
function initialize(logger) {
  _initialize({
    BaseService: new BaseService(logger),
    FooService: new FooService(logger)
  });
}
function _initialize(services) {
  if (_services) {
    throw new Error("Should not initialize the services multiple time!");
  }
  _services = services;
  for (const serv of Object.values(services)) {
    const injects = Object.getPrototypeOf(serv)[INJECTIONS_SYMBOL] || [];
    for (const i of injects) {
      const {type, field} = i;
      if (type in services) {
        const success = Reflect.set(serv, field, services[type]);
        if (!success) {
          throw new Error(`Cannot set service ${type} to ${Object.getPrototypeOf(serv)}`);
        }
      } else {
        throw new Error(`Cannot find service named ${type}! Which is required by ${Object.getPrototypeOf(serv).constructor.name}`);
      }
    }
  }
}
class ServiceNotFoundError extends Error {
  constructor(service) {
    super(`Cannot find service named ${service}!`);
    this.service = service;
  }
}
class ServiceMethodNotFoundError extends Error {
  constructor(service, method) {
    super(`Cannot find method named ${method} in service [${service}]!`);
    this.service = service;
    this.method = method;
  }
}
electron.ipcMain.handle("service:call", (event, name, method, ...payloads) => {
  if (!_services) {
    throw new Error("Cannot call any service until the services are ready!");
  }
  const service = _services[name];
  if (!service) {
    throw new ServiceNotFoundError(name);
  }
  if (!service[method]) {
    throw new ServiceMethodNotFoundError(name, method);
  }
  return service[method](...payloads);
});

var indexPreload = "F:\\ElectronProject\\charge-client\\dist\\index.preload.js";

"F:\\ElectronProject\\charge-client\\dist\\another.preload.js";

var indexHtmlUrl = "http://localhost:8080/index.html";

var logoUrl = "F:\\ElectronProject\\charge-client\\static/logo.png";

async function main() {
  const logger = new Logger();
  logger.initialize(electron.app.getPath("userData"));
  initialize(logger);
  electron.app.whenReady().then(() => {
    const main2 = createWindow();
    main2.menuBarVisible = false;
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    height: 800,
    width: 1280,
    webPreferences: {
      preload: indexPreload,
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: logoUrl
  });
  mainWindow.loadURL(indexHtmlUrl);
  return mainWindow;
}
if (!electron.app.requestSingleInstanceLock()) {
  electron.app.quit();
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
process.nextTick(main);

electron.app.on("browser-window-created", (event, window) => {
  if (!window.webContents.isDevToolsOpened()) {
    window.webContents.openDevTools();
    window.webContents.session.loadExtension(extensions).catch((e) => {
      console.error('Cannot find the vue extension. Please run "npm run postinstall" to install extension, or remove it and try again!');
    });
  }
});
const devServer = new net.Socket({}).connect(3031, "127.0.0.1");
devServer.on("data", () => {
  electron.BrowserWindow.getAllWindows().forEach((w) => w.reload());
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3Z1ZS1kZXZ0b29scyIsIi4uL3NyYy9tYWluL2RpYWxvZy50cyIsIi4uL3NyYy9tYWluL2xvZ2dlci50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL1NlcnZpY2UudHMiLCIuLi9zcmMvbWFpbi9zZXJ2aWNlcy9CYXNlU2VydmljZS50cyIsIi4uL3NyYy9zaGFyZWQvc2hhcmVkTGliLnRzIiwiLi4vc3JjL21haW4vc2VydmljZXMvRm9vU2VydmljZS50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL2luZGV4LnRzIiwiLi4vc3JjL3ByZWxvYWQvaW5kZXg/cHJlbG9hZCIsIi4uL3NyYy9wcmVsb2FkL2Fub3RoZXI/cHJlbG9hZCIsIi4uL3NyYy9yZW5kZXJlci9pbmRleC5odG1sP3JlbmRlcmVyIiwiLi4vc3RhdGljL2xvZ28ucG5nP3N0YXRpYyIsIi4uL3NyYy9tYWluL2luZGV4LnRzIiwiLi4vc3JjL21haW4vaW5kZXguZGV2LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFwiRjpcXEVsZWN0cm9uUHJvamVjdFxcY2hhcmdlLWNsaWVudFxcZXh0ZW5zaW9uc1wiIiwiaW1wb3J0IHsgaXBjTWFpbiwgZGlhbG9nIH0gZnJvbSAnZWxlY3Ryb24nXG5cbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd0NlcnRpZmljYXRlVHJ1c3REaWFsb2cnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93Q2VydGlmaWNhdGVUcnVzdERpYWxvZyhhcmdzWzBdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd0Vycm9yQm94JywgKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gIHJldHVybiBkaWFsb2cuc2hvd0Vycm9yQm94KGFyZ3NbMF0sIGFyZ3NbMV0pXG59KVxuaXBjTWFpbi5oYW5kbGUoJ2RpYWxvZzpzaG93TWVzc2FnZUJveCcsIChldmVudCwgLi4uYXJncykgPT4ge1xuICByZXR1cm4gZGlhbG9nLnNob3dNZXNzYWdlQm94KGFyZ3NbMF0pXG59KVxuaXBjTWFpbi5oYW5kbGUoJ2RpYWxvZzpzaG93T3BlbkRpYWxvZycsIChldmVudCwgLi4uYXJncykgPT4ge1xuICByZXR1cm4gZGlhbG9nLnNob3dPcGVuRGlhbG9nKGFyZ3NbMF0pXG59KVxuaXBjTWFpbi5oYW5kbGUoJ2RpYWxvZzpzaG93U2F2ZURpYWxvZycsIChldmVudCwgLi4uYXJncykgPT4ge1xuICByZXR1cm4gZGlhbG9nLnNob3dTYXZlRGlhbG9nKGFyZ3NbMF0pXG59KVxuIiwiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93IH0gZnJvbSAnZWxlY3Ryb24nXG5pbXBvcnQgeyBjcmVhdGVXcml0ZVN0cmVhbSB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBQYXNzVGhyb3VnaCwgcGlwZWxpbmUsIFRyYW5zZm9ybSB9IGZyb20gJ3N0cmVhbSdcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gJ3V0aWwnXG5cbmZ1bmN0aW9uIGZvcm1hdE1zZyhtZXNzYWdlOiBhbnksIG9wdGlvbnM6IGFueVtdKSB7IHJldHVybiBvcHRpb25zLmxlbmd0aCAhPT0gMCA/IGZvcm1hdChtZXNzYWdlLCBvcHRpb25zKSA6IGZvcm1hdChtZXNzYWdlKSB9XG5mdW5jdGlvbiBiYXNlVHJhbnNmb3JtKHRhZzogc3RyaW5nKSB7IHJldHVybiBuZXcgVHJhbnNmb3JtKHsgdHJhbnNmb3JtKGMsIGUsIGNiKSB7IGNiKHVuZGVmaW5lZCwgYFske3RhZ31dIFske25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKX1dICR7Y31cXG5gKSB9IH0pIH1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dnZXJGYWNhZGUge1xuICBsb2cobWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSk6IHZvaWQ7XG4gIHdhcm4obWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSk6IHZvaWQ7XG4gIGVycm9yKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pOiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgcHJpdmF0ZSBsb2dnZXJFbnRyaWVzID0geyBsb2c6IGJhc2VUcmFuc2Zvcm0oJ0lORk8nKSwgd2FybjogYmFzZVRyYW5zZm9ybSgnV0FSTicpLCBlcnJvcjogYmFzZVRyYW5zZm9ybSgnRVJST1InKSB9O1xuXG4gIHJlYWRvbmx5IGxvZyA9IChtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSA9PiB7IHRoaXMubG9nZ2VyRW50cmllcy5sb2cud3JpdGUoZm9ybWF0TXNnKG1lc3NhZ2UsIG9wdGlvbnMpKSB9XG5cbiAgcmVhZG9ubHkgd2FybiA9IChtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSA9PiB7IHRoaXMubG9nZ2VyRW50cmllcy53YXJuLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuXG4gIHJlYWRvbmx5IGVycm9yID0gKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pID0+IHsgdGhpcy5sb2dnZXJFbnRyaWVzLmVycm9yLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuXG4gIHByaXZhdGUgb3V0cHV0ID0gbmV3IFBhc3NUaHJvdWdoKCk7XG5cbiAgcHJpdmF0ZSBsb2dEaXJlY3Rvcnk6IHN0cmluZyA9ICcnXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgcGlwZWxpbmUodGhpcy5sb2dnZXJFbnRyaWVzLmxvZywgdGhpcy5vdXRwdXQsICgpID0+IHsgfSlcbiAgICBwaXBlbGluZSh0aGlzLmxvZ2dlckVudHJpZXMud2FybiwgdGhpcy5vdXRwdXQsICgpID0+IHsgfSlcbiAgICBwaXBlbGluZSh0aGlzLmxvZ2dlckVudHJpZXMuZXJyb3IsIHRoaXMub3V0cHV0LCAoKSA9PiB7IH0pXG5cbiAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnIpID0+IHtcbiAgICAgIHRoaXMuZXJyb3IoJ1VuY2F1Z2h0IEV4Y2VwdGlvbicpXG4gICAgICB0aGlzLmVycm9yKGVycilcbiAgICB9KVxuICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24pID0+IHtcbiAgICAgIHRoaXMuZXJyb3IoJ1VuY2F1Z2h0IFJlamVjdGlvbicpXG4gICAgICB0aGlzLmVycm9yKHJlYXNvbilcbiAgICB9KVxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgdGhpcy5vdXRwdXQub24oJ2RhdGEnLCAoYikgPT4geyBjb25zb2xlLmxvZyhiLnRvU3RyaW5nKCkpIH0pXG4gICAgfVxuICAgIGFwcC5vbmNlKCdicm93c2VyLXdpbmRvdy1jcmVhdGVkJywgKGV2ZW50LCB3aW5kb3cpID0+IHtcbiAgICAgIHRoaXMuY2FwdHVyZVdpbmRvd0xvZyh3aW5kb3cpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGxvZyBvdXRwdXQgZGlyZWN0b3J5XG4gICAqIEBwYXJhbSBkaXJlY3RvcnkgVGhlIGRpcmVjdG9yeSBvZiB0aGUgbG9nXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKGRpcmVjdG9yeTogc3RyaW5nKSB7XG4gICAgdGhpcy5sb2dEaXJlY3RvcnkgPSBkaXJlY3RvcnlcbiAgICBjb25zdCBtYWluTG9nID0gam9pbihkaXJlY3RvcnksICdtYWluLmxvZycpXG4gICAgY29uc3Qgc3RyZWFtID0gY3JlYXRlV3JpdGVTdHJlYW0obWFpbkxvZywgeyBlbmNvZGluZzogJ3V0Zi04JywgZmxhZ3M6ICd3KycgfSlcbiAgICB0aGlzLm91dHB1dC5waXBlKHN0cmVhbSlcbiAgICB0aGlzLmxvZyhgU2V0dXAgbWFpbiBsb2dnZXIgdG8gJHttYWluTG9nfWApXG4gIH1cblxuICAvKipcbiAgICogQ2FwdHVyZSB0aGUgd2luZG93IGxvZ1xuICAgKiBAcGFyYW0gd2luZG93IFRoZSBicm93c2VyIHdpbmRvd1xuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBhbGlhcyBvZiB0aGUgd2luZG93LiBVc2Ugd2luZG93LndlYkNvbnRlbnRzLmlkIGJ5IGRlZmF1bHRcbiAgICovXG4gIGNhcHR1cmVXaW5kb3dMb2cod2luZG93OiBCcm93c2VyV2luZG93LCBuYW1lPzogc3RyaW5nKSB7XG4gICAgbmFtZSA9IG5hbWUgPz8gd2luZG93LndlYkNvbnRlbnRzLmlkLnRvU3RyaW5nKClcbiAgICBpZiAoIXRoaXMubG9nRGlyZWN0b3J5KSB7XG4gICAgICB0aGlzLndhcm4oYENhbm5vdCBjYXB0dXJlIHdpbmRvdyBsb2cgZm9yIHdpbmRvdyAke25hbWV9LiBQbGVhc2UgaW5pdGlhbGl6ZSB0aGUgbG9nZ2VyIHRvIHNldCBsb2dnZXIgZGlyZWN0b3J5IWApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgbG9nZ2VyUGF0aCA9IHJlc29sdmUodGhpcy5sb2dEaXJlY3RvcnksIGByZW5kZXJlci4ke25hbWV9LmxvZ2ApXG4gICAgdGhpcy5sb2coYFNldHVwIHJlbmRlcmVyIGxvZ2dlciBmb3Igd2luZG93ICR7bmFtZX0gdG8gJHtsb2dnZXJQYXRofWApXG4gICAgY29uc3Qgc3RyZWFtID0gY3JlYXRlV3JpdGVTdHJlYW0obG9nZ2VyUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JywgZmxhZ3M6ICd3KycgfSlcbiAgICBjb25zdCBsZXZlbHMgPSBbJ0lORk8nLCAnV0FSTicsICdFUlJPUiddXG4gICAgd2luZG93LndlYkNvbnRlbnRzLm9uKCdjb25zb2xlLW1lc3NhZ2UnLCAoZSwgbGV2ZWwsIG1lc3NhZ2UsIGxpbmUsIGlkKSA9PiB7XG4gICAgICBzdHJlYW0ud3JpdGUoYFske2xldmVsc1tsZXZlbF19XSBbJHtuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCl9XSBbJHtpZH1dOiAke21lc3NhZ2V9XFxuYClcbiAgICB9KVxuICAgIHdpbmRvdy5vbmNlKCdjbG9zZScsICgpID0+IHtcbiAgICAgIHdpbmRvdy53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NvbnNvbGUtbWVzc2FnZScpXG4gICAgICBzdHJlYW0uY2xvc2UoKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogVGhpcyB3aWxsIGNyZWF0ZSBhIGxvZ2dlciBwcmVwZW5kIFske3RhZ31dIGJlZm9yZSBlYWNoIGxvZyBmcm9tIGl0XG4gICAqIEBwYXJhbSB0YWcgVGhlIHRhZyB0byBwcmVwZW5kXG4gICAqL1xuICBjcmVhdGVMb2dnZXJGb3IodGFnOiBzdHJpbmcpOiBMb2dnZXJGYWNhZGUge1xuICAgIGZ1bmN0aW9uIHRyYW5zZm9ybSh0YWc6IHN0cmluZykgeyByZXR1cm4gbmV3IFRyYW5zZm9ybSh7IHRyYW5zZm9ybShjLCBlLCBjYikgeyBjYih1bmRlZmluZWQsIGBbJHt0YWd9XSAke2N9XFxuYCkgfSB9KSB9XG4gICAgY29uc3QgbG9nID0gdHJhbnNmb3JtKHRhZykucGlwZSh0aGlzLmxvZ2dlckVudHJpZXMubG9nKVxuICAgIGNvbnN0IHdhcm4gPSB0cmFuc2Zvcm0odGFnKS5waXBlKHRoaXMubG9nZ2VyRW50cmllcy53YXJuKVxuICAgIGNvbnN0IGVycm9yID0gdHJhbnNmb3JtKHRhZykucGlwZSh0aGlzLmxvZ2dlckVudHJpZXMuZXJyb3IpXG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9nKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pIHsgbG9nLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfSxcbiAgICAgIHdhcm4obWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSkgeyB3YXJuLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfSxcbiAgICAgIGVycm9yKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pIHsgZXJyb3Iud3JpdGUoZm9ybWF0TXNnKG1lc3NhZ2UsIG9wdGlvbnMpKSB9XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBMb2dnZXIsIExvZ2dlckZhY2FkZSB9IGZyb20gJy9AbWFpbi9sb2dnZXInXG5cbmV4cG9ydCBjb25zdCBJTkpFQ1RJT05TX1NZTUJPTCA9IFN5bWJvbCgnX19pbmplY3Rpb25zX18nKVxuXG5leHBvcnQgZnVuY3Rpb24gSW5qZWN0KHR5cGU6IHN0cmluZykge1xuICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDogYW55LCBwcm9wZXJ0eUtleTogc3RyaW5nKSB7XG4gICAgaWYgKCFSZWZsZWN0Lmhhcyh0YXJnZXQsIElOSkVDVElPTlNfU1lNQk9MKSkge1xuICAgICAgUmVmbGVjdC5zZXQodGFyZ2V0LCBJTkpFQ1RJT05TX1NZTUJPTCwgW10pXG4gICAgfVxuICAgIGlmICghdHlwZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbmplY3QgcmVjaWV2ZWQgdHlwZTogJHt0eXBlfSFgKVxuICAgIH0gZWxzZSB7XG4gICAgICBSZWZsZWN0LmdldCh0YXJnZXQsIElOSkVDVElPTlNfU1lNQk9MKS5wdXNoKHsgdHlwZSwgZmllbGQ6IHByb3BlcnR5S2V5IH0pXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nXG4gIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXJGYWNhZGVcblxuICBjb25zdHJ1Y3Rvcihsb2dnZXI6IExvZ2dlcikge1xuICAgIHRoaXMubmFtZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgdGhpcy5sb2dnZXIgPSBsb2dnZXIuY3JlYXRlTG9nZ2VyRm9yKHRoaXMubmFtZSlcbiAgfVxuXG4gIHByb3RlY3RlZCBsb2cobTogYW55LCAuLi5hOiBhbnlbXSkge1xuICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7dGhpcy5uYW1lfV0gJHttfWAsIC4uLmEpXG4gIH1cblxuICBwcm90ZWN0ZWQgZXJyb3IobTogYW55LCAuLi5hOiBhbnlbXSkge1xuICAgIHRoaXMubG9nZ2VyLmVycm9yKGBbJHt0aGlzLm5hbWV9XSAke219YCwgLi4uYSlcbiAgfVxuXG4gIHByb3RlY3RlZCB3YXJuKG06IGFueSwgLi4uYTogYW55W10pIHtcbiAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHt0aGlzLm5hbWV9XSAke219YCwgLi4uYSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgYXBwIH0gZnJvbSAnZWxlY3Ryb24nXG5pbXBvcnQgeyBwbGF0Zm9ybSB9IGZyb20gJ29zJ1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4vU2VydmljZSdcblxuZXhwb3J0IGNsYXNzIEJhc2VTZXJ2aWNlIGV4dGVuZHMgU2VydmljZSB7XG4gIGFzeW5jIGdldEJhc2ljSW5mb3JtYXRpb24oKSB7XG4gICAgdGhpcy5sb2coJ2dldEJhc2ljSW5mb3JtYXRpb24gaXMgY2FsbGVkIScpXG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgcGxhdGZvcm06IHBsYXRmb3JtKCksXG4gICAgICB2ZXJzaW9uOiBhcHAuZ2V0VmVyc2lvbigpLFxuICAgICAgcm9vdDogYXBwLmdldFBhdGgoJ3VzZXJEYXRhJylcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gYWRkKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gIHJldHVybiBhICsgYlxufVxuIiwiaW1wb3J0IHsgQmFzZVNlcnZpY2UgfSBmcm9tICcuL0Jhc2VTZXJ2aWNlJ1xuaW1wb3J0IHsgSW5qZWN0LCBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJ1xuaW1wb3J0IHsgYWRkIH0gZnJvbSAnL0BzaGFyZWQvc2hhcmVkTGliJ1xuXG5leHBvcnQgY2xhc3MgRm9vU2VydmljZSBleHRlbmRzIFNlcnZpY2Uge1xuICBASW5qZWN0KCdCYXNlU2VydmljZScpXG4gIHByaXZhdGUgYmFzZVNlcnZpY2UhOiBCYXNlU2VydmljZVxuXG4gIC8qKlxuICAgKiBFeGFtcGxlIGZvciBpbmplY3QgYW5kIHNoYXJlZCBsaWJcbiAgICovXG4gIGFzeW5jIGZvbygpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmJhc2VTZXJ2aWNlLmdldEJhc2ljSW5mb3JtYXRpb24oKVxuICAgIGNvbnN0IHN1bSA9IGFkZCgxLCAyKVxuICAgIHRoaXMubG9nKGBDYWxsIGZ1bmN0aW9uIGltcG9ydGVkIGZyb20gL3NoYXJlZCBmb2xkZXIhIDEgKyAyID0gJHtzdW19YClcbiAgICByZXR1cm4ge1xuICAgICAgLi4ucmVzdWx0LFxuICAgICAgZm9vOiAnYmFyJ1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbG9nZ2VyJ1xuaW1wb3J0IHsgQmFzZVNlcnZpY2UgfSBmcm9tICcuL0Jhc2VTZXJ2aWNlJ1xuaW1wb3J0IHsgRm9vU2VydmljZSB9IGZyb20gJy4vRm9vU2VydmljZSdcbmltcG9ydCB7IElOSkVDVElPTlNfU1lNQk9MIH0gZnJvbSAnLi9TZXJ2aWNlJ1xuXG4vKipcbiAqIEFsbCBzZXJ2aWNlcyBkZWZpbml0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmljZXMge1xuICBGb29TZXJ2aWNlOiBGb29TZXJ2aWNlLFxuICBCYXNlU2VydmljZTogQmFzZVNlcnZpY2Vcbn1cblxubGV0IF9zZXJ2aWNlcyE6IFNlcnZpY2VzXG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgc2VydmljZXMgbW9kdWxlIHRvIHNlcnZlIGNsaWVudCAocmVuZGVyZXIgcHJvY2VzcylcbiAqXG4gKiBAcGFyYW0gbG9nZ2VyIFRoZSBzaW1wbGUgYXBwIGxvZ2dlclxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZShsb2dnZXI6IExvZ2dlcikge1xuICBfaW5pdGlhbGl6ZSh7XG4gICAgQmFzZVNlcnZpY2U6IG5ldyBCYXNlU2VydmljZShsb2dnZXIpLFxuICAgIEZvb1NlcnZpY2U6IG5ldyBGb29TZXJ2aWNlKGxvZ2dlcilcbiAgfSlcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBzZXJ2aWNlcyBtb2R1bGUgdG8gc2VydmUgY2xpZW50IChyZW5kZXJlciBwcm9jZXNzKVxuICpcbiAqIEBwYXJhbSBzZXJ2aWNlcyBUaGUgcnVubmluZyBzZXJ2aWNlcyBmb3IgY3VycmVudCBhcHBcbiAqL1xuZnVuY3Rpb24gX2luaXRpYWxpemUoc2VydmljZXM6IFNlcnZpY2VzKSB7XG4gIGlmIChfc2VydmljZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBub3QgaW5pdGlhbGl6ZSB0aGUgc2VydmljZXMgbXVsdGlwbGUgdGltZSEnKVxuICB9XG4gIF9zZXJ2aWNlcyA9IHNlcnZpY2VzXG4gIGZvciAoY29uc3Qgc2VydiBvZiBPYmplY3QudmFsdWVzKHNlcnZpY2VzKSkge1xuICAgIGNvbnN0IGluamVjdHMgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc2VydilbSU5KRUNUSU9OU19TWU1CT0xdIHx8IFtdXG4gICAgZm9yIChjb25zdCBpIG9mIGluamVjdHMpIHtcbiAgICAgIGNvbnN0IHsgdHlwZSwgZmllbGQgfSA9IGlcbiAgICAgIGlmICh0eXBlIGluIHNlcnZpY2VzKSB7XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBSZWZsZWN0LnNldChzZXJ2LCBmaWVsZCwgKHNlcnZpY2VzIGFzIGFueSlbdHlwZV0pXG4gICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHNldCBzZXJ2aWNlICR7dHlwZX0gdG8gJHtPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc2Vydil9YClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBzZXJ2aWNlIG5hbWVkICR7dHlwZX0hIFdoaWNoIGlzIHJlcXVpcmVkIGJ5ICR7T2JqZWN0LmdldFByb3RvdHlwZU9mKHNlcnYpLmNvbnN0cnVjdG9yLm5hbWV9YClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlcnZpY2VOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBzZXJ2aWNlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2Fubm90IGZpbmQgc2VydmljZSBuYW1lZCAke3NlcnZpY2V9IWApXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlTWV0aG9kTm90Rm91bmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgc2VydmljZTogc3RyaW5nLCByZWFkb25seSBtZXRob2Q6IHN0cmluZykge1xuICAgIHN1cGVyKGBDYW5ub3QgZmluZCBtZXRob2QgbmFtZWQgJHttZXRob2R9IGluIHNlcnZpY2UgWyR7c2VydmljZX1dIWApXG4gIH1cbn1cblxuaXBjTWFpbi5oYW5kbGUoJ3NlcnZpY2U6Y2FsbCcsIChldmVudCwgbmFtZTogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgLi4ucGF5bG9hZHM6IGFueVtdKSA9PiB7XG4gIGlmICghX3NlcnZpY2VzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBhbnkgc2VydmljZSB1bnRpbCB0aGUgc2VydmljZXMgYXJlIHJlYWR5IScpXG4gIH1cbiAgY29uc3Qgc2VydmljZSA9IChfc2VydmljZXMgYXMgYW55KVtuYW1lXVxuICBpZiAoIXNlcnZpY2UpIHtcbiAgICB0aHJvdyBuZXcgU2VydmljZU5vdEZvdW5kRXJyb3IobmFtZSlcbiAgfVxuICBpZiAoIXNlcnZpY2VbbWV0aG9kXSkge1xuICAgIHRocm93IG5ldyBTZXJ2aWNlTWV0aG9kTm90Rm91bmRFcnJvcihuYW1lLCBtZXRob2QpXG4gIH1cbiAgcmV0dXJuIHNlcnZpY2VbbWV0aG9kXSguLi5wYXlsb2Fkcylcbn0pXG4iLCJleHBvcnQgZGVmYXVsdCBfX0FTU0VUU19fNzExYzlhMzFfXyIsImV4cG9ydCBkZWZhdWx0IF9fQVNTRVRTX18wMzUwZTM1Y19fIiwiZXhwb3J0IGRlZmF1bHQgXCJodHRwOi8vbG9jYWxob3N0OjgwODAvaW5kZXguaHRtbFwiOyIsImV4cG9ydCBkZWZhdWx0IFwiRjpcXFxcRWxlY3Ryb25Qcm9qZWN0XFxcXGNoYXJnZS1jbGllbnRcXFxcc3RhdGljL2xvZ28ucG5nXCIiLCJpbXBvcnQgeyBhcHAsIEJyb3dzZXJXaW5kb3cgfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCAnLi9kaWFsb2cnXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCB7IGluaXRpYWxpemUgfSBmcm9tICcuL3NlcnZpY2VzJ1xuaW1wb3J0IGluZGV4UHJlbG9hZCBmcm9tICcvQHByZWxvYWQvaW5kZXgnXG5pbXBvcnQgYW5vdGhlclByZWxvYWQgZnJvbSAnL0BwcmVsb2FkL2Fub3RoZXInXG5pbXBvcnQgaW5kZXhIdG1sVXJsIGZyb20gJy9AcmVuZGVyZXIvaW5kZXguaHRtbCdcbmltcG9ydCBzaWRlSHRtbFVybCBmcm9tICcvQHJlbmRlcmVyL3NpZGUuaHRtbCdcbmltcG9ydCBsb2dvVXJsIGZyb20gJy9Ac3RhdGljL2xvZ28ucG5nJ1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKClcbiAgbG9nZ2VyLmluaXRpYWxpemUoYXBwLmdldFBhdGgoJ3VzZXJEYXRhJykpXG4gIGluaXRpYWxpemUobG9nZ2VyKVxuICBhcHAud2hlblJlYWR5KCkudGhlbigoKSA9PiB7XG4gICAgY29uc3QgbWFpbiA9IGNyZWF0ZVdpbmRvdygpXG4gICAgLy8g5LiN5pi+56S66I+c5Y2V5qCPXG4gICAgbWFpbi5tZW51QmFyVmlzaWJsZSA9IGZhbHNlXG4gICAgLy8gY29uc3QgW3gsIHldID0gbWFpbi5nZXRQb3NpdGlvbigpXG4gICAgLy8gY29uc3Qgc2lkZSA9IGNyZWF0ZVNlY29uZFdpbmRvdygpXG4gICAgLy8gc2lkZS5zZXRQb3NpdGlvbih4ICsgODAwICsgNSwgeSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlV2luZG93KCkge1xuICAvLyBDcmVhdGUgdGhlIGJyb3dzZXIgd2luZG93LlxuICBjb25zdCBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xuICAgIGhlaWdodDogODAwLFxuICAgIHdpZHRoOiAxMjgwLFxuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBwcmVsb2FkOiBpbmRleFByZWxvYWQsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZVxuICAgIH0sXG4gICAgaWNvbjogbG9nb1VybFxuICB9KVxuXG4gIG1haW5XaW5kb3cubG9hZFVSTChpbmRleEh0bWxVcmwpXG4gIHJldHVybiBtYWluV2luZG93XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlY29uZFdpbmRvdygpIHtcbiAgY29uc3Qgc2lkZVdpbmRvdyA9IG5ldyBCcm93c2VyV2luZG93KHtcbiAgICBoZWlnaHQ6IDYwMCxcbiAgICB3aWR0aDogMzAwLFxuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBwcmVsb2FkOiBhbm90aGVyUHJlbG9hZCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlXG4gICAgfVxuICB9KVxuXG4gIHNpZGVXaW5kb3cubG9hZFVSTChzaWRlSHRtbFVybClcbiAgcmV0dXJuIHNpZGVXaW5kb3dcbn1cblxuLy8gZW5zdXJlIGFwcCBzdGFydCBhcyBzaW5nbGUgaW5zdGFuY2VcbmlmICghYXBwLnJlcXVlc3RTaW5nbGVJbnN0YW5jZUxvY2soKSkge1xuICBhcHAucXVpdCgpXG59XG5cbmFwcC5vbignd2luZG93LWFsbC1jbG9zZWQnLCAoKSA9PiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnZGFyd2luJykge1xuICAgIGFwcC5xdWl0KClcbiAgfVxufSlcblxucHJvY2Vzcy5uZXh0VGljayhtYWluKVxuIiwiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93IH0gZnJvbSAnZWxlY3Ryb24nXG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tICduZXQnXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgZXh0ZW5zaW9ucyBmcm9tICd2dWUtZGV2dG9vbHMnXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L2ZpcnN0XG5pbXBvcnQgJy4vaW5kZXgnXG5cbmFwcC5vbignYnJvd3Nlci13aW5kb3ctY3JlYXRlZCcsIChldmVudCwgd2luZG93KSA9PiB7XG4gIGlmICghd2luZG93LndlYkNvbnRlbnRzLmlzRGV2VG9vbHNPcGVuZWQoKSkge1xuICAgIHdpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxuICAgIHdpbmRvdy53ZWJDb250ZW50cy5zZXNzaW9uLmxvYWRFeHRlbnNpb24oZXh0ZW5zaW9ucylcbiAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5ub3QgZmluZCB0aGUgdnVlIGV4dGVuc2lvbi4gUGxlYXNlIHJ1biBcIm5wbSBydW4gcG9zdGluc3RhbGxcIiB0byBpbnN0YWxsIGV4dGVuc2lvbiwgb3IgcmVtb3ZlIGl0IGFuZCB0cnkgYWdhaW4hJylcbiAgICAgIH0pXG4gIH1cbn0pXG5cbmNvbnN0IGRldlNlcnZlciA9IG5ldyBTb2NrZXQoe30pLmNvbm5lY3QoMzAzMSwgJzEyNy4wLjAuMScpXG5kZXZTZXJ2ZXIub24oJ2RhdGEnLCAoKSA9PiB7XG4gIEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLmZvckVhY2godyA9PiB3LnJlbG9hZCgpKVxufSlcbiJdLCJuYW1lcyI6WyJpcGNNYWluIiwiZGlhbG9nIiwiZm9ybWF0IiwiVHJhbnNmb3JtIiwiUGFzc1Rocm91Z2giLCJqb2luIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJyZXNvbHZlIiwicGxhdGZvcm0iLCJhcHAiLCJCcm93c2VyV2luZG93IiwiU29ja2V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsaUJBQWU7O0FDRWZBLGlCQUFRLE9BQU8scUNBQXFDLENBQUMsVUFBVSxTQUFTO0FBQ3RFLFNBQU9DLGdCQUFPLDJCQUEyQixL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
