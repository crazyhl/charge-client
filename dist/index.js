'use strict';

var electron = require('electron');
var net = require('net');
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var util = require('util');
var os = require('os');

var extensions = "/Users/haoliang/ElectronProject/charge-client/extensions";

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

var indexPreload = "/Users/haoliang/ElectronProject/charge-client/dist/index.preload.js";

"/Users/haoliang/ElectronProject/charge-client/dist/another.preload.js";

var indexHtmlUrl = "http://localhost:8080/index.html";

var logoUrl = "/Users/haoliang/ElectronProject/charge-client/static/logo.png";

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3Z1ZS1kZXZ0b29scyIsIi4uL3NyYy9tYWluL2RpYWxvZy50cyIsIi4uL3NyYy9tYWluL2xvZ2dlci50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL1NlcnZpY2UudHMiLCIuLi9zcmMvbWFpbi9zZXJ2aWNlcy9CYXNlU2VydmljZS50cyIsIi4uL3NyYy9zaGFyZWQvc2hhcmVkTGliLnRzIiwiLi4vc3JjL21haW4vc2VydmljZXMvRm9vU2VydmljZS50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL2luZGV4LnRzIiwiLi4vc3JjL3ByZWxvYWQvaW5kZXg/cHJlbG9hZCIsIi4uL3NyYy9wcmVsb2FkL2Fub3RoZXI/cHJlbG9hZCIsIi4uL3NyYy9yZW5kZXJlci9pbmRleC5odG1sP3JlbmRlcmVyIiwiLi4vc3RhdGljL2xvZ28ucG5nP3N0YXRpYyIsIi4uL3NyYy9tYWluL2luZGV4LnRzIiwiLi4vc3JjL21haW4vaW5kZXguZGV2LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFwiL1VzZXJzL2hhb2xpYW5nL0VsZWN0cm9uUHJvamVjdC9jaGFyZ2UtY2xpZW50L2V4dGVuc2lvbnNcIiIsImltcG9ydCB7IGlwY01haW4sIGRpYWxvZyB9IGZyb20gJ2VsZWN0cm9uJ1xuXG5pcGNNYWluLmhhbmRsZSgnZGlhbG9nOnNob3dDZXJ0aWZpY2F0ZVRydXN0RGlhbG9nJywgKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gIHJldHVybiBkaWFsb2cuc2hvd0NlcnRpZmljYXRlVHJ1c3REaWFsb2coYXJnc1swXSlcbn0pXG5pcGNNYWluLmhhbmRsZSgnZGlhbG9nOnNob3dFcnJvckJveCcsIChldmVudCwgLi4uYXJncykgPT4ge1xuICByZXR1cm4gZGlhbG9nLnNob3dFcnJvckJveChhcmdzWzBdLCBhcmdzWzFdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd01lc3NhZ2VCb3gnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93TWVzc2FnZUJveChhcmdzWzBdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd09wZW5EaWFsb2cnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93T3BlbkRpYWxvZyhhcmdzWzBdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd1NhdmVEaWFsb2cnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93U2F2ZURpYWxvZyhhcmdzWzBdKVxufSlcbiIsImltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdyB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHsgY3JlYXRlV3JpdGVTdHJlYW0gfSBmcm9tICdmcydcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgUGFzc1Rocm91Z2gsIHBpcGVsaW5lLCBUcmFuc2Zvcm0gfSBmcm9tICdzdHJlYW0nXG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tICd1dGlsJ1xuXG5mdW5jdGlvbiBmb3JtYXRNc2cobWVzc2FnZTogYW55LCBvcHRpb25zOiBhbnlbXSkgeyByZXR1cm4gb3B0aW9ucy5sZW5ndGggIT09IDAgPyBmb3JtYXQobWVzc2FnZSwgb3B0aW9ucykgOiBmb3JtYXQobWVzc2FnZSkgfVxuZnVuY3Rpb24gYmFzZVRyYW5zZm9ybSh0YWc6IHN0cmluZykgeyByZXR1cm4gbmV3IFRyYW5zZm9ybSh7IHRyYW5zZm9ybShjLCBlLCBjYikgeyBjYih1bmRlZmluZWQsIGBbJHt0YWd9XSBbJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9XSAke2N9XFxuYCkgfSB9KSB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nZ2VyRmFjYWRlIHtcbiAgbG9nKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pOiB2b2lkO1xuICB3YXJuKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pOiB2b2lkO1xuICBlcnJvcihtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgbG9nZ2VyRW50cmllcyA9IHsgbG9nOiBiYXNlVHJhbnNmb3JtKCdJTkZPJyksIHdhcm46IGJhc2VUcmFuc2Zvcm0oJ1dBUk4nKSwgZXJyb3I6IGJhc2VUcmFuc2Zvcm0oJ0VSUk9SJykgfTtcblxuICByZWFkb25seSBsb2cgPSAobWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSkgPT4geyB0aGlzLmxvZ2dlckVudHJpZXMubG9nLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuXG4gIHJlYWRvbmx5IHdhcm4gPSAobWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSkgPT4geyB0aGlzLmxvZ2dlckVudHJpZXMud2Fybi53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH1cblxuICByZWFkb25seSBlcnJvciA9IChtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSA9PiB7IHRoaXMubG9nZ2VyRW50cmllcy5lcnJvci53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH1cblxuICBwcml2YXRlIG91dHB1dCA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXG4gIHByaXZhdGUgbG9nRGlyZWN0b3J5OiBzdHJpbmcgPSAnJ1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHBpcGVsaW5lKHRoaXMubG9nZ2VyRW50cmllcy5sb2csIHRoaXMub3V0cHV0LCAoKSA9PiB7IH0pXG4gICAgcGlwZWxpbmUodGhpcy5sb2dnZXJFbnRyaWVzLndhcm4sIHRoaXMub3V0cHV0LCAoKSA9PiB7IH0pXG4gICAgcGlwZWxpbmUodGhpcy5sb2dnZXJFbnRyaWVzLmVycm9yLCB0aGlzLm91dHB1dCwgKCkgPT4geyB9KVxuXG4gICAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyKSA9PiB7XG4gICAgICB0aGlzLmVycm9yKCdVbmNhdWdodCBFeGNlcHRpb24nKVxuICAgICAgdGhpcy5lcnJvcihlcnIpXG4gICAgfSlcbiAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uKSA9PiB7XG4gICAgICB0aGlzLmVycm9yKCdVbmNhdWdodCBSZWplY3Rpb24nKVxuICAgICAgdGhpcy5lcnJvcihyZWFzb24pXG4gICAgfSlcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcpIHtcbiAgICAgIHRoaXMub3V0cHV0Lm9uKCdkYXRhJywgKGIpID0+IHsgY29uc29sZS5sb2coYi50b1N0cmluZygpKSB9KVxuICAgIH1cbiAgICBhcHAub25jZSgnYnJvd3Nlci13aW5kb3ctY3JlYXRlZCcsIChldmVudCwgd2luZG93KSA9PiB7XG4gICAgICB0aGlzLmNhcHR1cmVXaW5kb3dMb2cod2luZG93KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBsb2cgb3V0cHV0IGRpcmVjdG9yeVxuICAgKiBAcGFyYW0gZGlyZWN0b3J5IFRoZSBkaXJlY3Rvcnkgb2YgdGhlIGxvZ1xuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZShkaXJlY3Rvcnk6IHN0cmluZykge1xuICAgIHRoaXMubG9nRGlyZWN0b3J5ID0gZGlyZWN0b3J5XG4gICAgY29uc3QgbWFpbkxvZyA9IGpvaW4oZGlyZWN0b3J5LCAnbWFpbi5sb2cnKVxuICAgIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVdyaXRlU3RyZWFtKG1haW5Mb2csIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGZsYWdzOiAndysnIH0pXG4gICAgdGhpcy5vdXRwdXQucGlwZShzdHJlYW0pXG4gICAgdGhpcy5sb2coYFNldHVwIG1haW4gbG9nZ2VyIHRvICR7bWFpbkxvZ31gKVxuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmUgdGhlIHdpbmRvdyBsb2dcbiAgICogQHBhcmFtIHdpbmRvdyBUaGUgYnJvd3NlciB3aW5kb3dcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgYWxpYXMgb2YgdGhlIHdpbmRvdy4gVXNlIHdpbmRvdy53ZWJDb250ZW50cy5pZCBieSBkZWZhdWx0XG4gICAqL1xuICBjYXB0dXJlV2luZG93TG9nKHdpbmRvdzogQnJvd3NlcldpbmRvdywgbmFtZT86IHN0cmluZykge1xuICAgIG5hbWUgPSBuYW1lID8/IHdpbmRvdy53ZWJDb250ZW50cy5pZC50b1N0cmluZygpXG4gICAgaWYgKCF0aGlzLmxvZ0RpcmVjdG9yeSkge1xuICAgICAgdGhpcy53YXJuKGBDYW5ub3QgY2FwdHVyZSB3aW5kb3cgbG9nIGZvciB3aW5kb3cgJHtuYW1lfS4gUGxlYXNlIGluaXRpYWxpemUgdGhlIGxvZ2dlciB0byBzZXQgbG9nZ2VyIGRpcmVjdG9yeSFgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGxvZ2dlclBhdGggPSByZXNvbHZlKHRoaXMubG9nRGlyZWN0b3J5LCBgcmVuZGVyZXIuJHtuYW1lfS5sb2dgKVxuICAgIHRoaXMubG9nKGBTZXR1cCByZW5kZXJlciBsb2dnZXIgZm9yIHdpbmRvdyAke25hbWV9IHRvICR7bG9nZ2VyUGF0aH1gKVxuICAgIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVdyaXRlU3RyZWFtKGxvZ2dlclBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGZsYWdzOiAndysnIH0pXG4gICAgY29uc3QgbGV2ZWxzID0gWydJTkZPJywgJ1dBUk4nLCAnRVJST1InXVxuICAgIHdpbmRvdy53ZWJDb250ZW50cy5vbignY29uc29sZS1tZXNzYWdlJywgKGUsIGxldmVsLCBtZXNzYWdlLCBsaW5lLCBpZCkgPT4ge1xuICAgICAgc3RyZWFtLndyaXRlKGBbJHtsZXZlbHNbbGV2ZWxdfV0gWyR7bmV3IERhdGUoKS50b1VUQ1N0cmluZygpfV0gWyR7aWR9XTogJHttZXNzYWdlfVxcbmApXG4gICAgfSlcbiAgICB3aW5kb3cub25jZSgnY2xvc2UnLCAoKSA9PiB7XG4gICAgICB3aW5kb3cud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjb25zb2xlLW1lc3NhZ2UnKVxuICAgICAgc3RyZWFtLmNsb3NlKClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBjcmVhdGUgYSBsb2dnZXIgcHJlcGVuZCBbJHt0YWd9XSBiZWZvcmUgZWFjaCBsb2cgZnJvbSBpdFxuICAgKiBAcGFyYW0gdGFnIFRoZSB0YWcgdG8gcHJlcGVuZFxuICAgKi9cbiAgY3JlYXRlTG9nZ2VyRm9yKHRhZzogc3RyaW5nKTogTG9nZ2VyRmFjYWRlIHtcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm0odGFnOiBzdHJpbmcpIHsgcmV0dXJuIG5ldyBUcmFuc2Zvcm0oeyB0cmFuc2Zvcm0oYywgZSwgY2IpIHsgY2IodW5kZWZpbmVkLCBgWyR7dGFnfV0gJHtjfVxcbmApIH0gfSkgfVxuICAgIGNvbnN0IGxvZyA9IHRyYW5zZm9ybSh0YWcpLnBpcGUodGhpcy5sb2dnZXJFbnRyaWVzLmxvZylcbiAgICBjb25zdCB3YXJuID0gdHJhbnNmb3JtKHRhZykucGlwZSh0aGlzLmxvZ2dlckVudHJpZXMud2FybilcbiAgICBjb25zdCBlcnJvciA9IHRyYW5zZm9ybSh0YWcpLnBpcGUodGhpcy5sb2dnZXJFbnRyaWVzLmVycm9yKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvZyhtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSB7IGxvZy53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH0sXG4gICAgICB3YXJuKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pIHsgd2Fybi53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH0sXG4gICAgICBlcnJvcihtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSB7IGVycm9yLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyLCBMb2dnZXJGYWNhZGUgfSBmcm9tICcvQG1haW4vbG9nZ2VyJ1xuXG5leHBvcnQgY29uc3QgSU5KRUNUSU9OU19TWU1CT0wgPSBTeW1ib2woJ19faW5qZWN0aW9uc19fJylcblxuZXhwb3J0IGZ1bmN0aW9uIEluamVjdCh0eXBlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZykge1xuICAgIGlmICghUmVmbGVjdC5oYXModGFyZ2V0LCBJTkpFQ1RJT05TX1NZTUJPTCkpIHtcbiAgICAgIFJlZmxlY3Quc2V0KHRhcmdldCwgSU5KRUNUSU9OU19TWU1CT0wsIFtdKVxuICAgIH1cbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW5qZWN0IHJlY2lldmVkIHR5cGU6ICR7dHlwZX0hYClcbiAgICB9IGVsc2Uge1xuICAgICAgUmVmbGVjdC5nZXQodGFyZ2V0LCBJTkpFQ1RJT05TX1NZTUJPTCkucHVzaCh7IHR5cGUsIGZpZWxkOiBwcm9wZXJ0eUtleSB9KVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmljZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZ1xuICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyRmFjYWRlXG5cbiAgY29uc3RydWN0b3IobG9nZ2VyOiBMb2dnZXIpIHtcbiAgICB0aGlzLm5hbWUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IubmFtZVxuICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyLmNyZWF0ZUxvZ2dlckZvcih0aGlzLm5hbWUpXG4gIH1cblxuICBwcm90ZWN0ZWQgbG9nKG06IGFueSwgLi4uYTogYW55W10pIHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske3RoaXMubmFtZX1dICR7bX1gLCAuLi5hKVxuICB9XG5cbiAgcHJvdGVjdGVkIGVycm9yKG06IGFueSwgLi4uYTogYW55W10pIHtcbiAgICB0aGlzLmxvZ2dlci5lcnJvcihgWyR7dGhpcy5uYW1lfV0gJHttfWAsIC4uLmEpXG4gIH1cblxuICBwcm90ZWN0ZWQgd2FybihtOiBhbnksIC4uLmE6IGFueVtdKSB7XG4gICAgdGhpcy5sb2dnZXIud2FybihgWyR7dGhpcy5uYW1lfV0gJHttfWAsIC4uLmEpXG4gIH1cbn1cbiIsImltcG9ydCB7IGFwcCB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHsgcGxhdGZvcm0gfSBmcm9tICdvcydcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuL1NlcnZpY2UnXG5cbmV4cG9ydCBjbGFzcyBCYXNlU2VydmljZSBleHRlbmRzIFNlcnZpY2Uge1xuICBhc3luYyBnZXRCYXNpY0luZm9ybWF0aW9uKCkge1xuICAgIHRoaXMubG9nKCdnZXRCYXNpY0luZm9ybWF0aW9uIGlzIGNhbGxlZCEnKVxuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybSgpLFxuICAgICAgdmVyc2lvbjogYXBwLmdldFZlcnNpb24oKSxcbiAgICAgIHJvb3Q6IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGFkZChhOiBudW1iZXIsIGI6IG51bWJlcikge1xuICByZXR1cm4gYSArIGJcbn1cbiIsImltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9CYXNlU2VydmljZSdcbmltcG9ydCB7IEluamVjdCwgU2VydmljZSB9IGZyb20gJy4vU2VydmljZSdcbmltcG9ydCB7IGFkZCB9IGZyb20gJy9Ac2hhcmVkL3NoYXJlZExpYidcblxuZXhwb3J0IGNsYXNzIEZvb1NlcnZpY2UgZXh0ZW5kcyBTZXJ2aWNlIHtcbiAgQEluamVjdCgnQmFzZVNlcnZpY2UnKVxuICBwcml2YXRlIGJhc2VTZXJ2aWNlITogQmFzZVNlcnZpY2VcblxuICAvKipcbiAgICogRXhhbXBsZSBmb3IgaW5qZWN0IGFuZCBzaGFyZWQgbGliXG4gICAqL1xuICBhc3luYyBmb28oKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5iYXNlU2VydmljZS5nZXRCYXNpY0luZm9ybWF0aW9uKClcbiAgICBjb25zdCBzdW0gPSBhZGQoMSwgMilcbiAgICB0aGlzLmxvZyhgQ2FsbCBmdW5jdGlvbiBpbXBvcnRlZCBmcm9tIC9zaGFyZWQgZm9sZGVyISAxICsgMiA9ICR7c3VtfWApXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnJlc3VsdCxcbiAgICAgIGZvbzogJ2JhcidcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGlwY01haW4gfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2xvZ2dlcidcbmltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9CYXNlU2VydmljZSdcbmltcG9ydCB7IEZvb1NlcnZpY2UgfSBmcm9tICcuL0Zvb1NlcnZpY2UnXG5pbXBvcnQgeyBJTkpFQ1RJT05TX1NZTUJPTCB9IGZyb20gJy4vU2VydmljZSdcblxuLyoqXG4gKiBBbGwgc2VydmljZXMgZGVmaW5pdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZpY2VzIHtcbiAgRm9vU2VydmljZTogRm9vU2VydmljZSxcbiAgQmFzZVNlcnZpY2U6IEJhc2VTZXJ2aWNlXG59XG5cbmxldCBfc2VydmljZXMhOiBTZXJ2aWNlc1xuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIHNlcnZpY2VzIG1vZHVsZSB0byBzZXJ2ZSBjbGllbnQgKHJlbmRlcmVyIHByb2Nlc3MpXG4gKlxuICogQHBhcmFtIGxvZ2dlciBUaGUgc2ltcGxlIGFwcCBsb2dnZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemUobG9nZ2VyOiBMb2dnZXIpIHtcbiAgX2luaXRpYWxpemUoe1xuICAgIEJhc2VTZXJ2aWNlOiBuZXcgQmFzZVNlcnZpY2UobG9nZ2VyKSxcbiAgICBGb29TZXJ2aWNlOiBuZXcgRm9vU2VydmljZShsb2dnZXIpXG4gIH0pXG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgc2VydmljZXMgbW9kdWxlIHRvIHNlcnZlIGNsaWVudCAocmVuZGVyZXIgcHJvY2VzcylcbiAqXG4gKiBAcGFyYW0gc2VydmljZXMgVGhlIHJ1bm5pbmcgc2VydmljZXMgZm9yIGN1cnJlbnQgYXBwXG4gKi9cbmZ1bmN0aW9uIF9pbml0aWFsaXplKHNlcnZpY2VzOiBTZXJ2aWNlcykge1xuICBpZiAoX3NlcnZpY2VzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTaG91bGQgbm90IGluaXRpYWxpemUgdGhlIHNlcnZpY2VzIG11bHRpcGxlIHRpbWUhJylcbiAgfVxuICBfc2VydmljZXMgPSBzZXJ2aWNlc1xuICBmb3IgKGNvbnN0IHNlcnYgb2YgT2JqZWN0LnZhbHVlcyhzZXJ2aWNlcykpIHtcbiAgICBjb25zdCBpbmplY3RzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHNlcnYpW0lOSkVDVElPTlNfU1lNQk9MXSB8fCBbXVxuICAgIGZvciAoY29uc3QgaSBvZiBpbmplY3RzKSB7XG4gICAgICBjb25zdCB7IHR5cGUsIGZpZWxkIH0gPSBpXG4gICAgICBpZiAodHlwZSBpbiBzZXJ2aWNlcykge1xuICAgICAgICBjb25zdCBzdWNjZXNzID0gUmVmbGVjdC5zZXQoc2VydiwgZmllbGQsIChzZXJ2aWNlcyBhcyBhbnkpW3R5cGVdKVxuICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzZXQgc2VydmljZSAke3R5cGV9IHRvICR7T2JqZWN0LmdldFByb3RvdHlwZU9mKHNlcnYpfWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgc2VydmljZSBuYW1lZCAke3R5cGV9ISBXaGljaCBpcyByZXF1aXJlZCBieSAke09iamVjdC5nZXRQcm90b3R5cGVPZihzZXJ2KS5jb25zdHJ1Y3Rvci5uYW1lfWApXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlTm90Rm91bmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgc2VydmljZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENhbm5vdCBmaW5kIHNlcnZpY2UgbmFtZWQgJHtzZXJ2aWNlfSFgKVxuICB9XG59XG5leHBvcnQgY2xhc3MgU2VydmljZU1ldGhvZE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHNlcnZpY2U6IHN0cmluZywgcmVhZG9ubHkgbWV0aG9kOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2Fubm90IGZpbmQgbWV0aG9kIG5hbWVkICR7bWV0aG9kfSBpbiBzZXJ2aWNlIFske3NlcnZpY2V9XSFgKVxuICB9XG59XG5cbmlwY01haW4uaGFuZGxlKCdzZXJ2aWNlOmNhbGwnLCAoZXZlbnQsIG5hbWU6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIC4uLnBheWxvYWRzOiBhbnlbXSkgPT4ge1xuICBpZiAoIV9zZXJ2aWNlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgYW55IHNlcnZpY2UgdW50aWwgdGhlIHNlcnZpY2VzIGFyZSByZWFkeSEnKVxuICB9XG4gIGNvbnN0IHNlcnZpY2UgPSAoX3NlcnZpY2VzIGFzIGFueSlbbmFtZV1cbiAgaWYgKCFzZXJ2aWNlKSB7XG4gICAgdGhyb3cgbmV3IFNlcnZpY2VOb3RGb3VuZEVycm9yKG5hbWUpXG4gIH1cbiAgaWYgKCFzZXJ2aWNlW21ldGhvZF0pIHtcbiAgICB0aHJvdyBuZXcgU2VydmljZU1ldGhvZE5vdEZvdW5kRXJyb3IobmFtZSwgbWV0aG9kKVxuICB9XG4gIHJldHVybiBzZXJ2aWNlW21ldGhvZF0oLi4ucGF5bG9hZHMpXG59KVxuIiwiZXhwb3J0IGRlZmF1bHQgX19BU1NFVFNfXzMyNjlkODA5X18iLCJleHBvcnQgZGVmYXVsdCBfX0FTU0VUU19fMzZjNzRjNmJfXyIsImV4cG9ydCBkZWZhdWx0IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwL2luZGV4Lmh0bWxcIjsiLCJleHBvcnQgZGVmYXVsdCBcIi9Vc2Vycy9oYW9saWFuZy9FbGVjdHJvblByb2plY3QvY2hhcmdlLWNsaWVudC9zdGF0aWMvbG9nby5wbmdcIiIsImltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdyB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0ICcuL2RpYWxvZydcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJ1xuaW1wb3J0IHsgaW5pdGlhbGl6ZSB9IGZyb20gJy4vc2VydmljZXMnXG5pbXBvcnQgaW5kZXhQcmVsb2FkIGZyb20gJy9AcHJlbG9hZC9pbmRleCdcbmltcG9ydCBhbm90aGVyUHJlbG9hZCBmcm9tICcvQHByZWxvYWQvYW5vdGhlcidcbmltcG9ydCBpbmRleEh0bWxVcmwgZnJvbSAnL0ByZW5kZXJlci9pbmRleC5odG1sJ1xuaW1wb3J0IHNpZGVIdG1sVXJsIGZyb20gJy9AcmVuZGVyZXIvc2lkZS5odG1sJ1xuaW1wb3J0IGxvZ29VcmwgZnJvbSAnL0BzdGF0aWMvbG9nby5wbmcnXG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoKVxuICBsb2dnZXIuaW5pdGlhbGl6ZShhcHAuZ2V0UGF0aCgndXNlckRhdGEnKSlcbiAgaW5pdGlhbGl6ZShsb2dnZXIpXG4gIGFwcC53aGVuUmVhZHkoKS50aGVuKCgpID0+IHtcbiAgICBjb25zdCBtYWluID0gY3JlYXRlV2luZG93KClcbiAgICAvLyDkuI3mmL7npLroj5zljZXmoI9cbiAgICBtYWluLm1lbnVCYXJWaXNpYmxlID0gZmFsc2VcbiAgICAvLyBjb25zdCBbeCwgeV0gPSBtYWluLmdldFBvc2l0aW9uKClcbiAgICAvLyBjb25zdCBzaWRlID0gY3JlYXRlU2Vjb25kV2luZG93KClcbiAgICAvLyBzaWRlLnNldFBvc2l0aW9uKHggKyA4MDAgKyA1LCB5KVxuICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVXaW5kb3coKSB7XG4gIC8vIENyZWF0ZSB0aGUgYnJvd3NlciB3aW5kb3cuXG4gIGNvbnN0IG1haW5XaW5kb3cgPSBuZXcgQnJvd3NlcldpbmRvdyh7XG4gICAgaGVpZ2h0OiA4MDAsXG4gICAgd2lkdGg6IDEyODAsXG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIHByZWxvYWQ6IGluZGV4UHJlbG9hZCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlXG4gICAgfSxcbiAgICBpY29uOiBsb2dvVXJsXG4gIH0pXG5cbiAgbWFpbldpbmRvdy5sb2FkVVJMKGluZGV4SHRtbFVybClcbiAgcmV0dXJuIG1haW5XaW5kb3dcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2Vjb25kV2luZG93KCkge1xuICBjb25zdCBzaWRlV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xuICAgIGhlaWdodDogNjAwLFxuICAgIHdpZHRoOiAzMDAsXG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIHByZWxvYWQ6IGFub3RoZXJQcmVsb2FkLFxuICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2VcbiAgICB9XG4gIH0pXG5cbiAgc2lkZVdpbmRvdy5sb2FkVVJMKHNpZGVIdG1sVXJsKVxuICByZXR1cm4gc2lkZVdpbmRvd1xufVxuXG4vLyBlbnN1cmUgYXBwIHN0YXJ0IGFzIHNpbmdsZSBpbnN0YW5jZVxuaWYgKCFhcHAucmVxdWVzdFNpbmdsZUluc3RhbmNlTG9jaygpKSB7XG4gIGFwcC5xdWl0KClcbn1cblxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICdkYXJ3aW4nKSB7XG4gICAgYXBwLnF1aXQoKVxuICB9XG59KVxuXG5wcm9jZXNzLm5leHRUaWNrKG1haW4pXG4iLCJpbXBvcnQgeyBhcHAsIEJyb3dzZXJXaW5kb3cgfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gJ25ldCdcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBleHRlbnNpb25zIGZyb20gJ3Z1ZS1kZXZ0b29scydcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvZmlyc3RcbmltcG9ydCAnLi9pbmRleCdcblxuYXBwLm9uKCdicm93c2VyLXdpbmRvdy1jcmVhdGVkJywgKGV2ZW50LCB3aW5kb3cpID0+IHtcbiAgaWYgKCF3aW5kb3cud2ViQ29udGVudHMuaXNEZXZUb29sc09wZW5lZCgpKSB7XG4gICAgd2luZG93LndlYkNvbnRlbnRzLm9wZW5EZXZUb29scygpXG4gICAgd2luZG93LndlYkNvbnRlbnRzLnNlc3Npb24ubG9hZEV4dGVuc2lvbihleHRlbnNpb25zKVxuICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Nhbm5vdCBmaW5kIHRoZSB2dWUgZXh0ZW5zaW9uLiBQbGVhc2UgcnVuIFwibnBtIHJ1biBwb3N0aW5zdGFsbFwiIHRvIGluc3RhbGwgZXh0ZW5zaW9uLCBvciByZW1vdmUgaXQgYW5kIHRyeSBhZ2FpbiEnKVxuICAgICAgfSlcbiAgfVxufSlcblxuY29uc3QgZGV2U2VydmVyID0gbmV3IFNvY2tldCh7fSkuY29ubmVjdCgzMDMxLCAnMTI3LjAuMC4xJylcbmRldlNlcnZlci5vbignZGF0YScsICgpID0+IHtcbiAgQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuZm9yRWFjaCh3ID0+IHcucmVsb2FkKCkpXG59KVxuIl0sIm5hbWVzIjpbImlwY01haW4iLCJkaWFsb2ciLCJmb3JtYXQiLCJUcmFuc2Zvcm0iLCJQYXNzVGhyb3VnaCIsImpvaW4iLCJjcmVhdGVXcml0ZVN0cmVhbSIsInJlc29sdmUiLCJwbGF0Zm9ybSIsImFwcCIsIkJyb3dzZXJXaW5kb3ciLCJTb2NrZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQkFBZTs7QUNFZkEsaUJBQVEsT0FBTyxxQ0FBcUMsQ0FBQyxVQUFVLFNBQVM7QUFDdEUsU0FBT0Ms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
