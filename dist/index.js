"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var minimist_1 = __importDefault(require("minimist"));
var writeRouteFile_1 = __importDefault(require("aspida/dist/writeRouteFile"));
var watchInputDir_1 = __importDefault(require("aspida/dist/watchInputDir"));
var buildServerFile_1 = __importDefault(require("./buildServerFile"));
var run = function (args) {
    var argv = (0, minimist_1.default)(args, {
        string: ['version', 'watch', 'project'],
        alias: { v: 'version', w: 'watch', p: 'project' }
    });
    var dir = '.';
    // eslint-disable-next-line no-unused-expressions
    argv.version !== undefined
        ? console.log("v".concat(require('../package.json').version))
        : argv.watch !== undefined
            ? ((0, writeRouteFile_1.default)((0, buildServerFile_1.default)(dir, argv.project)), (0, watchInputDir_1.default)(dir, function () { return (0, writeRouteFile_1.default)((0, buildServerFile_1.default)(dir, argv.project)); }))
            : (0, writeRouteFile_1.default)((0, buildServerFile_1.default)(dir, argv.project));
};
exports.run = run;
//# sourceMappingURL=index.js.map