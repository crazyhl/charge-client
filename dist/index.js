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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3Z1ZS1kZXZ0b29scyIsIi4uL3NyYy9tYWluL2RpYWxvZy50cyIsIi4uL3NyYy9tYWluL2xvZ2dlci50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL1NlcnZpY2UudHMiLCIuLi9zcmMvbWFpbi9zZXJ2aWNlcy9CYXNlU2VydmljZS50cyIsIi4uL3NyYy9zaGFyZWQvc2hhcmVkTGliLnRzIiwiLi4vc3JjL21haW4vc2VydmljZXMvRm9vU2VydmljZS50cyIsIi4uL3NyYy9tYWluL3NlcnZpY2VzL2luZGV4LnRzIiwiLi4vc3JjL3ByZWxvYWQvaW5kZXg/cHJlbG9hZCIsIi4uL3NyYy9yZW5kZXJlci9pbmRleC5odG1sP3JlbmRlcmVyIiwiLi4vc3RhdGljL2xvZ28ucG5nP3N0YXRpYyIsIi4uL3NyYy9tYWluL2luZGV4LnRzIiwiLi4vc3JjL21haW4vaW5kZXguZGV2LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFwiL1VzZXJzL2hhb2xpYW5nL0VsZWN0cm9uUHJvamVjdC9jaGFyZ2UtY2xpZW50L2V4dGVuc2lvbnNcIiIsImltcG9ydCB7IGlwY01haW4sIGRpYWxvZyB9IGZyb20gJ2VsZWN0cm9uJ1xuXG5pcGNNYWluLmhhbmRsZSgnZGlhbG9nOnNob3dDZXJ0aWZpY2F0ZVRydXN0RGlhbG9nJywgKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gIHJldHVybiBkaWFsb2cuc2hvd0NlcnRpZmljYXRlVHJ1c3REaWFsb2coYXJnc1swXSlcbn0pXG5pcGNNYWluLmhhbmRsZSgnZGlhbG9nOnNob3dFcnJvckJveCcsIChldmVudCwgLi4uYXJncykgPT4ge1xuICByZXR1cm4gZGlhbG9nLnNob3dFcnJvckJveChhcmdzWzBdLCBhcmdzWzFdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd01lc3NhZ2VCb3gnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93TWVzc2FnZUJveChhcmdzWzBdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd09wZW5EaWFsb2cnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93T3BlbkRpYWxvZyhhcmdzWzBdKVxufSlcbmlwY01haW4uaGFuZGxlKCdkaWFsb2c6c2hvd1NhdmVEaWFsb2cnLCAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgcmV0dXJuIGRpYWxvZy5zaG93U2F2ZURpYWxvZyhhcmdzWzBdKVxufSlcbiIsImltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdyB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHsgY3JlYXRlV3JpdGVTdHJlYW0gfSBmcm9tICdmcydcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgUGFzc1Rocm91Z2gsIHBpcGVsaW5lLCBUcmFuc2Zvcm0gfSBmcm9tICdzdHJlYW0nXG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tICd1dGlsJ1xuXG5mdW5jdGlvbiBmb3JtYXRNc2cobWVzc2FnZTogYW55LCBvcHRpb25zOiBhbnlbXSkgeyByZXR1cm4gb3B0aW9ucy5sZW5ndGggIT09IDAgPyBmb3JtYXQobWVzc2FnZSwgb3B0aW9ucykgOiBmb3JtYXQobWVzc2FnZSkgfVxuZnVuY3Rpb24gYmFzZVRyYW5zZm9ybSh0YWc6IHN0cmluZykgeyByZXR1cm4gbmV3IFRyYW5zZm9ybSh7IHRyYW5zZm9ybShjLCBlLCBjYikgeyBjYih1bmRlZmluZWQsIGBbJHt0YWd9XSBbJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9XSAke2N9XFxuYCkgfSB9KSB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nZ2VyRmFjYWRlIHtcbiAgbG9nKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pOiB2b2lkO1xuICB3YXJuKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pOiB2b2lkO1xuICBlcnJvcihtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgbG9nZ2VyRW50cmllcyA9IHsgbG9nOiBiYXNlVHJhbnNmb3JtKCdJTkZPJyksIHdhcm46IGJhc2VUcmFuc2Zvcm0oJ1dBUk4nKSwgZXJyb3I6IGJhc2VUcmFuc2Zvcm0oJ0VSUk9SJykgfTtcblxuICByZWFkb25seSBsb2cgPSAobWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSkgPT4geyB0aGlzLmxvZ2dlckVudHJpZXMubG9nLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuXG4gIHJlYWRvbmx5IHdhcm4gPSAobWVzc2FnZTogYW55LCAuLi5vcHRpb25zOiBhbnlbXSkgPT4geyB0aGlzLmxvZ2dlckVudHJpZXMud2Fybi53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH1cblxuICByZWFkb25seSBlcnJvciA9IChtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSA9PiB7IHRoaXMubG9nZ2VyRW50cmllcy5lcnJvci53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH1cblxuICBwcml2YXRlIG91dHB1dCA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXG4gIHByaXZhdGUgbG9nRGlyZWN0b3J5OiBzdHJpbmcgPSAnJ1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHBpcGVsaW5lKHRoaXMubG9nZ2VyRW50cmllcy5sb2csIHRoaXMub3V0cHV0LCAoKSA9PiB7IH0pXG4gICAgcGlwZWxpbmUodGhpcy5sb2dnZXJFbnRyaWVzLndhcm4sIHRoaXMub3V0cHV0LCAoKSA9PiB7IH0pXG4gICAgcGlwZWxpbmUodGhpcy5sb2dnZXJFbnRyaWVzLmVycm9yLCB0aGlzLm91dHB1dCwgKCkgPT4geyB9KVxuXG4gICAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyKSA9PiB7XG4gICAgICB0aGlzLmVycm9yKCdVbmNhdWdodCBFeGNlcHRpb24nKVxuICAgICAgdGhpcy5lcnJvcihlcnIpXG4gICAgfSlcbiAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uKSA9PiB7XG4gICAgICB0aGlzLmVycm9yKCdVbmNhdWdodCBSZWplY3Rpb24nKVxuICAgICAgdGhpcy5lcnJvcihyZWFzb24pXG4gICAgfSlcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcpIHtcbiAgICAgIHRoaXMub3V0cHV0Lm9uKCdkYXRhJywgKGIpID0+IHsgY29uc29sZS5sb2coYi50b1N0cmluZygpKSB9KVxuICAgIH1cbiAgICBhcHAub25jZSgnYnJvd3Nlci13aW5kb3ctY3JlYXRlZCcsIChldmVudCwgd2luZG93KSA9PiB7XG4gICAgICB0aGlzLmNhcHR1cmVXaW5kb3dMb2cod2luZG93KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBsb2cgb3V0cHV0IGRpcmVjdG9yeVxuICAgKiBAcGFyYW0gZGlyZWN0b3J5IFRoZSBkaXJlY3Rvcnkgb2YgdGhlIGxvZ1xuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZShkaXJlY3Rvcnk6IHN0cmluZykge1xuICAgIHRoaXMubG9nRGlyZWN0b3J5ID0gZGlyZWN0b3J5XG4gICAgY29uc3QgbWFpbkxvZyA9IGpvaW4oZGlyZWN0b3J5LCAnbWFpbi5sb2cnKVxuICAgIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVdyaXRlU3RyZWFtKG1haW5Mb2csIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGZsYWdzOiAndysnIH0pXG4gICAgdGhpcy5vdXRwdXQucGlwZShzdHJlYW0pXG4gICAgdGhpcy5sb2coYFNldHVwIG1haW4gbG9nZ2VyIHRvICR7bWFpbkxvZ31gKVxuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmUgdGhlIHdpbmRvdyBsb2dcbiAgICogQHBhcmFtIHdpbmRvdyBUaGUgYnJvd3NlciB3aW5kb3dcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgYWxpYXMgb2YgdGhlIHdpbmRvdy4gVXNlIHdpbmRvdy53ZWJDb250ZW50cy5pZCBieSBkZWZhdWx0XG4gICAqL1xuICBjYXB0dXJlV2luZG93TG9nKHdpbmRvdzogQnJvd3NlcldpbmRvdywgbmFtZT86IHN0cmluZykge1xuICAgIG5hbWUgPSBuYW1lID8/IHdpbmRvdy53ZWJDb250ZW50cy5pZC50b1N0cmluZygpXG4gICAgaWYgKCF0aGlzLmxvZ0RpcmVjdG9yeSkge1xuICAgICAgdGhpcy53YXJuKGBDYW5ub3QgY2FwdHVyZSB3aW5kb3cgbG9nIGZvciB3aW5kb3cgJHtuYW1lfS4gUGxlYXNlIGluaXRpYWxpemUgdGhlIGxvZ2dlciB0byBzZXQgbG9nZ2VyIGRpcmVjdG9yeSFgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGxvZ2dlclBhdGggPSByZXNvbHZlKHRoaXMubG9nRGlyZWN0b3J5LCBgcmVuZGVyZXIuJHtuYW1lfS5sb2dgKVxuICAgIHRoaXMubG9nKGBTZXR1cCByZW5kZXJlciBsb2dnZXIgZm9yIHdpbmRvdyAke25hbWV9IHRvICR7bG9nZ2VyUGF0aH1gKVxuICAgIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVdyaXRlU3RyZWFtKGxvZ2dlclBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGZsYWdzOiAndysnIH0pXG4gICAgY29uc3QgbGV2ZWxzID0gWydJTkZPJywgJ1dBUk4nLCAnRVJST1InXVxuICAgIHdpbmRvdy53ZWJDb250ZW50cy5vbignY29uc29sZS1tZXNzYWdlJywgKGUsIGxldmVsLCBtZXNzYWdlLCBsaW5lLCBpZCkgPT4ge1xuICAgICAgc3RyZWFtLndyaXRlKGBbJHtsZXZlbHNbbGV2ZWxdfV0gWyR7bmV3IERhdGUoKS50b1VUQ1N0cmluZygpfV0gWyR7aWR9XTogJHttZXNzYWdlfVxcbmApXG4gICAgfSlcbiAgICB3aW5kb3cub25jZSgnY2xvc2UnLCAoKSA9PiB7XG4gICAgICB3aW5kb3cud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjb25zb2xlLW1lc3NhZ2UnKVxuICAgICAgc3RyZWFtLmNsb3NlKClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBjcmVhdGUgYSBsb2dnZXIgcHJlcGVuZCBbJHt0YWd9XSBiZWZvcmUgZWFjaCBsb2cgZnJvbSBpdFxuICAgKiBAcGFyYW0gdGFnIFRoZSB0YWcgdG8gcHJlcGVuZFxuICAgKi9cbiAgY3JlYXRlTG9nZ2VyRm9yKHRhZzogc3RyaW5nKTogTG9nZ2VyRmFjYWRlIHtcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm0odGFnOiBzdHJpbmcpIHsgcmV0dXJuIG5ldyBUcmFuc2Zvcm0oeyB0cmFuc2Zvcm0oYywgZSwgY2IpIHsgY2IodW5kZWZpbmVkLCBgWyR7dGFnfV0gJHtjfVxcbmApIH0gfSkgfVxuICAgIGNvbnN0IGxvZyA9IHRyYW5zZm9ybSh0YWcpLnBpcGUodGhpcy5sb2dnZXJFbnRyaWVzLmxvZylcbiAgICBjb25zdCB3YXJuID0gdHJhbnNmb3JtKHRhZykucGlwZSh0aGlzLmxvZ2dlckVudHJpZXMud2FybilcbiAgICBjb25zdCBlcnJvciA9IHRyYW5zZm9ybSh0YWcpLnBpcGUodGhpcy5sb2dnZXJFbnRyaWVzLmVycm9yKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvZyhtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSB7IGxvZy53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH0sXG4gICAgICB3YXJuKG1lc3NhZ2U6IGFueSwgLi4ub3B0aW9uczogYW55W10pIHsgd2Fybi53cml0ZShmb3JtYXRNc2cobWVzc2FnZSwgb3B0aW9ucykpIH0sXG4gICAgICBlcnJvcihtZXNzYWdlOiBhbnksIC4uLm9wdGlvbnM6IGFueVtdKSB7IGVycm9yLndyaXRlKGZvcm1hdE1zZyhtZXNzYWdlLCBvcHRpb25zKSkgfVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyLCBMb2dnZXJGYWNhZGUgfSBmcm9tICcvQG1haW4vbG9nZ2VyJ1xuXG5leHBvcnQgY29uc3QgSU5KRUNUSU9OU19TWU1CT0wgPSBTeW1ib2woJ19faW5qZWN0aW9uc19fJylcblxuZXhwb3J0IGZ1bmN0aW9uIEluamVjdCh0eXBlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZykge1xuICAgIGlmICghUmVmbGVjdC5oYXModGFyZ2V0LCBJTkpFQ1RJT05TX1NZTUJPTCkpIHtcbiAgICAgIFJlZmxlY3Quc2V0KHRhcmdldCwgSU5KRUNUSU9OU19TWU1CT0wsIFtdKVxuICAgIH1cbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW5qZWN0IHJlY2lldmVkIHR5cGU6ICR7dHlwZX0hYClcbiAgICB9IGVsc2Uge1xuICAgICAgUmVmbGVjdC5nZXQodGFyZ2V0LCBJTkpFQ1RJT05TX1NZTUJPTCkucHVzaCh7IHR5cGUsIGZpZWxkOiBwcm9wZXJ0eUtleSB9KVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmljZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZ1xuICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyRmFjYWRlXG5cbiAgY29uc3RydWN0b3IobG9nZ2VyOiBMb2dnZXIpIHtcbiAgICB0aGlzLm5hbWUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IubmFtZVxuICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyLmNyZWF0ZUxvZ2dlckZvcih0aGlzLm5hbWUpXG4gIH1cblxuICBwcm90ZWN0ZWQgbG9nKG06IGFueSwgLi4uYTogYW55W10pIHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske3RoaXMubmFtZX1dICR7bX1gLCAuLi5hKVxuICB9XG5cbiAgcHJvdGVjdGVkIGVycm9yKG06IGFueSwgLi4uYTogYW55W10pIHtcbiAgICB0aGlzLmxvZ2dlci5lcnJvcihgWyR7dGhpcy5uYW1lfV0gJHttfWAsIC4uLmEpXG4gIH1cblxuICBwcm90ZWN0ZWQgd2FybihtOiBhbnksIC4uLmE6IGFueVtdKSB7XG4gICAgdGhpcy5sb2dnZXIud2FybihgWyR7dGhpcy5uYW1lfV0gJHttfWAsIC4uLmEpXG4gIH1cbn1cbiIsImltcG9ydCB7IGFwcCB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHsgcGxhdGZvcm0gfSBmcm9tICdvcydcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuL1NlcnZpY2UnXG5cbmV4cG9ydCBjbGFzcyBCYXNlU2VydmljZSBleHRlbmRzIFNlcnZpY2Uge1xuICBhc3luYyBnZXRCYXNpY0luZm9ybWF0aW9uKCkge1xuICAgIHRoaXMubG9nKCdnZXRCYXNpY0luZm9ybWF0aW9uIGlzIGNhbGxlZCEnKVxuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybSgpLFxuICAgICAgdmVyc2lvbjogYXBwLmdldFZlcnNpb24oKSxcbiAgICAgIHJvb3Q6IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGFkZChhOiBudW1iZXIsIGI6IG51bWJlcikge1xuICByZXR1cm4gYSArIGJcbn1cbiIsImltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9CYXNlU2VydmljZSdcbmltcG9ydCB7IEluamVjdCwgU2VydmljZSB9IGZyb20gJy4vU2VydmljZSdcbmltcG9ydCB7IGFkZCB9IGZyb20gJy9Ac2hhcmVkL3NoYXJlZExpYidcblxuZXhwb3J0IGNsYXNzIEZvb1NlcnZpY2UgZXh0ZW5kcyBTZXJ2aWNlIHtcbiAgQEluamVjdCgnQmFzZVNlcnZpY2UnKVxuICBwcml2YXRlIGJhc2VTZXJ2aWNlITogQmFzZVNlcnZpY2VcblxuICAvKipcbiAgICogRXhhbXBsZSBmb3IgaW5qZWN0IGFuZCBzaGFyZWQgbGliXG4gICAqL1xuICBhc3luYyBmb28oKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5iYXNlU2VydmljZS5nZXRCYXNpY0luZm9ybWF0aW9uKClcbiAgICBjb25zdCBzdW0gPSBhZGQoMSwgMilcbiAgICB0aGlzLmxvZyhgQ2FsbCBmdW5jdGlvbiBpbXBvcnRlZCBmcm9tIC9zaGFyZWQgZm9sZGVyISAxICsgMiA9ICR7c3VtfWApXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnJlc3VsdCxcbiAgICAgIGZvbzogJ2JhcidcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGlwY01haW4gfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2xvZ2dlcidcbmltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9CYXNlU2VydmljZSdcbmltcG9ydCB7IEZvb1NlcnZpY2UgfSBmcm9tICcuL0Zvb1NlcnZpY2UnXG5pbXBvcnQgeyBJTkpFQ1RJT05TX1NZTUJPTCB9IGZyb20gJy4vU2VydmljZSdcblxuLyoqXG4gKiBBbGwgc2VydmljZXMgZGVmaW5pdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZpY2VzIHtcbiAgRm9vU2VydmljZTogRm9vU2VydmljZSxcbiAgQmFzZVNlcnZpY2U6IEJhc2VTZXJ2aWNlXG59XG5cbmxldCBfc2VydmljZXMhOiBTZXJ2aWNlc1xuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIHNlcnZpY2VzIG1vZHVsZSB0byBzZXJ2ZSBjbGllbnQgKHJlbmRlcmVyIHByb2Nlc3MpXG4gKlxuICogQHBhcmFtIGxvZ2dlciBUaGUgc2ltcGxlIGFwcCBsb2dnZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemUobG9nZ2VyOiBMb2dnZXIpIHtcbiAgX2luaXRpYWxpemUoe1xuICAgIEJhc2VTZXJ2aWNlOiBuZXcgQmFzZVNlcnZpY2UobG9nZ2VyKSxcbiAgICBGb29TZXJ2aWNlOiBuZXcgRm9vU2VydmljZShsb2dnZXIpXG4gIH0pXG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgc2VydmljZXMgbW9kdWxlIHRvIHNlcnZlIGNsaWVudCAocmVuZGVyZXIgcHJvY2VzcylcbiAqXG4gKiBAcGFyYW0gc2VydmljZXMgVGhlIHJ1bm5pbmcgc2VydmljZXMgZm9yIGN1cnJlbnQgYXBwXG4gKi9cbmZ1bmN0aW9uIF9pbml0aWFsaXplKHNlcnZpY2VzOiBTZXJ2aWNlcykge1xuICBpZiAoX3NlcnZpY2VzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTaG91bGQgbm90IGluaXRpYWxpemUgdGhlIHNlcnZpY2VzIG11bHRpcGxlIHRpbWUhJylcbiAgfVxuICBfc2VydmljZXMgPSBzZXJ2aWNlc1xuICBmb3IgKGNvbnN0IHNlcnYgb2YgT2JqZWN0LnZhbHVlcyhzZXJ2aWNlcykpIHtcbiAgICBjb25zdCBpbmplY3RzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHNlcnYpW0lOSkVDVElPTlNfU1lNQk9MXSB8fCBbXVxuICAgIGZvciAoY29uc3QgaSBvZiBpbmplY3RzKSB7XG4gICAgICBjb25zdCB7IHR5cGUsIGZpZWxkIH0gPSBpXG4gICAgICBpZiAodHlwZSBpbiBzZXJ2aWNlcykge1xuICAgICAgICBjb25zdCBzdWNjZXNzID0gUmVmbGVjdC5zZXQoc2VydiwgZmllbGQsIChzZXJ2aWNlcyBhcyBhbnkpW3R5cGVdKVxuICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzZXQgc2VydmljZSAke3R5cGV9IHRvICR7T2JqZWN0LmdldFByb3RvdHlwZU9mKHNlcnYpfWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgc2VydmljZSBuYW1lZCAke3R5cGV9ISBXaGljaCBpcyByZXF1aXJlZCBieSAke09iamVjdC5nZXRQcm90b3R5cGVPZihzZXJ2KS5jb25zdHJ1Y3Rvci5uYW1lfWApXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlTm90Rm91bmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgc2VydmljZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENhbm5vdCBmaW5kIHNlcnZpY2UgbmFtZWQgJHtzZXJ2aWNlfSFgKVxuICB9XG59XG5leHBvcnQgY2xhc3MgU2VydmljZU1ldGhvZE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHNlcnZpY2U6IHN0cmluZywgcmVhZG9ubHkgbWV0aG9kOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2Fubm90IGZpbmQgbWV0aG9kIG5hbWVkICR7bWV0aG9kfSBpbiBzZXJ2aWNlIFske3NlcnZpY2V9XSFgKVxuICB9XG59XG5cbmlwY01haW4uaGFuZGxlKCdzZXJ2aWNlOmNhbGwnLCAoZXZlbnQsIG5hbWU6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIC4uLnBheWxvYWRzOiBhbnlbXSkgPT4ge1xuICBpZiAoIV9zZXJ2aWNlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgYW55IHNlcnZpY2UgdW50aWwgdGhlIHNlcnZpY2VzIGFyZSByZWFkeSEnKVxuICB9XG4gIGNvbnN0IHNlcnZpY2UgPSAoX3NlcnZpY2VzIGFzIGFueSlbbmFtZV1cbiAgaWYgKCFzZXJ2aWNlKSB7XG4gICAgdGhyb3cgbmV3IFNlcnZpY2VOb3RGb3VuZEVycm9yKG5hbWUpXG4gIH1cbiAgaWYgKCFzZXJ2aWNlW21ldGhvZF0pIHtcbiAgICB0aHJvdyBuZXcgU2VydmljZU1ldGhvZE5vdEZvdW5kRXJyb3IobmFtZSwgbWV0aG9kKVxuICB9XG4gIHJldHVybiBzZXJ2aWNlW21ldGhvZF0oLi4ucGF5bG9hZHMpXG59KVxuIiwiZXhwb3J0IGRlZmF1bHQgX19BU1NFVFNfXzMyNjlkODA5X18iLCJleHBvcnQgZGVmYXVsdCBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9pbmRleC5odG1sXCI7IiwiZXhwb3J0IGRlZmF1bHQgXCIvVXNlcnMvaGFvbGlhbmcvRWxlY3Ryb25Qcm9qZWN0L2NoYXJnZS1jbGllbnQvc3RhdGljL2xvZ28ucG5nXCIiLCJpbXBvcnQgeyBhcHAsIEJyb3dzZXJXaW5kb3cgfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCAnLi9kaWFsb2cnXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCB7IGluaXRpYWxpemUgfSBmcm9tICcuL3NlcnZpY2VzJ1xuaW1wb3J0IGluZGV4UHJlbG9hZCBmcm9tICcvQHByZWxvYWQvaW5kZXgnXG4vLyBpbXBvcnQgYW5vdGhlclByZWxvYWQgZnJvbSAnL0BwcmVsb2FkL2Fub3RoZXInXG5pbXBvcnQgaW5kZXhIdG1sVXJsIGZyb20gJy9AcmVuZGVyZXIvaW5kZXguaHRtbCdcbi8vIGltcG9ydCBzaWRlSHRtbFVybCBmcm9tICcvQHJlbmRlcmVyL3NpZGUuaHRtbCdcbmltcG9ydCBsb2dvVXJsIGZyb20gJy9Ac3RhdGljL2xvZ28ucG5nJ1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKClcbiAgbG9nZ2VyLmluaXRpYWxpemUoYXBwLmdldFBhdGgoJ3VzZXJEYXRhJykpXG4gIGluaXRpYWxpemUobG9nZ2VyKVxuICBhcHAud2hlblJlYWR5KCkudGhlbigoKSA9PiB7XG4gICAgY29uc3QgbWFpbiA9IGNyZWF0ZVdpbmRvdygpXG4gICAgLy8g5LiN5pi+56S66I+c5Y2V5qCPXG4gICAgbWFpbi5tZW51QmFyVmlzaWJsZSA9IGZhbHNlXG4gICAgLy8gY29uc3QgW3gsIHldID0gbWFpbi5nZXRQb3NpdGlvbigpXG4gICAgLy8gY29uc3Qgc2lkZSA9IGNyZWF0ZVNlY29uZFdpbmRvdygpXG4gICAgLy8gc2lkZS5zZXRQb3NpdGlvbih4ICsgODAwICsgNSwgeSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlV2luZG93KCkge1xuICAvLyBDcmVhdGUgdGhlIGJyb3dzZXIgd2luZG93LlxuICBjb25zdCBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xuICAgIGhlaWdodDogODAwLFxuICAgIHdpZHRoOiAxMjgwLFxuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBwcmVsb2FkOiBpbmRleFByZWxvYWQsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZVxuICAgIH0sXG4gICAgaWNvbjogbG9nb1VybFxuICB9KVxuXG4gIG1haW5XaW5kb3cubG9hZFVSTChpbmRleEh0bWxVcmwpXG4gIHJldHVybiBtYWluV2luZG93XG59XG5cbi8vIGZ1bmN0aW9uIGNyZWF0ZVNlY29uZFdpbmRvdygpIHtcbi8vICAgY29uc3Qgc2lkZVdpbmRvdyA9IG5ldyBCcm93c2VyV2luZG93KHtcbi8vICAgICBoZWlnaHQ6IDYwMCxcbi8vICAgICB3aWR0aDogMzAwLFxuLy8gICAgIHdlYlByZWZlcmVuY2VzOiB7XG4vLyAgICAgICBwcmVsb2FkOiBhbm90aGVyUHJlbG9hZCxcbi8vICAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4vLyAgICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlXG4vLyAgICAgfVxuLy8gICB9KVxuXG4vLyAgIHNpZGVXaW5kb3cubG9hZFVSTChzaWRlSHRtbFVybClcbi8vICAgcmV0dXJuIHNpZGVXaW5kb3dcbi8vIH1cblxuLy8gZW5zdXJlIGFwcCBzdGFydCBhcyBzaW5nbGUgaW5zdGFuY2VcbmlmICghYXBwLnJlcXVlc3RTaW5nbGVJbnN0YW5jZUxvY2soKSkge1xuICBhcHAucXVpdCgpXG59XG5cbmFwcC5vbignd2luZG93LWFsbC1jbG9zZWQnLCAoKSA9PiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnZGFyd2luJykge1xuICAgIGFwcC5xdWl0KClcbiAgfVxufSlcblxucHJvY2Vzcy5uZXh0VGljayhtYWluKVxuIiwiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93IH0gZnJvbSAnZWxlY3Ryb24nXG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tICduZXQnXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgZXh0ZW5zaW9ucyBmcm9tICd2dWUtZGV2dG9vbHMnXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L2ZpcnN0XG5pbXBvcnQgJy4vaW5kZXgnXG5cbmFwcC5vbignYnJvd3Nlci13aW5kb3ctY3JlYXRlZCcsIChldmVudCwgd2luZG93KSA9PiB7XG4gIGlmICghd2luZG93LndlYkNvbnRlbnRzLmlzRGV2VG9vbHNPcGVuZWQoKSkge1xuICAgIHdpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxuICAgIHdpbmRvdy53ZWJDb250ZW50cy5zZXNzaW9uLmxvYWRFeHRlbnNpb24oZXh0ZW5zaW9ucylcbiAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5ub3QgZmluZCB0aGUgdnVlIGV4dGVuc2lvbi4gUGxlYXNlIHJ1biBcIm5wbSBydW4gcG9zdGluc3RhbGxcIiB0byBpbnN0YWxsIGV4dGVuc2lvbiwgb3IgcmVtb3ZlIGl0IGFuZCB0cnkgYWdhaW4hJylcbiAgICAgIH0pXG4gIH1cbn0pXG5cbmNvbnN0IGRldlNlcnZlciA9IG5ldyBTb2NrZXQoe30pLmNvbm5lY3QoMzAzMSwgJzEyNy4wLjAuMScpXG5kZXZTZXJ2ZXIub24oJ2RhdGEnLCAoKSA9PiB7XG4gIEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLmZvckVhY2godyA9PiB3LnJlbG9hZCgpKVxufSlcbiJdLCJuYW1lcyI6WyJpcGNNYWluIiwiZGlhbG9nIiwiZm9ybWF0IiwiVHJhbnNmb3JtIiwiUGFzc1Rocm91Z2giLCJqb2luIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJyZXNvbHZlIiwicGxhdGZvcm0iLCJhcHAiLCJCcm93c2VyV2luZG93IiwiU29ja2V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsaUJBQWU7O0FDRWZBLGlCQUFRLE9BQU8scUNBQXFDLENBQUMsVUFBVSxTQUFTO0FBQ3RFLFNBQU9DLGdCQUFPLDJCQUEyQixLQUFLO0FBQUE7QUFF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
