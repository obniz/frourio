"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
exports.default = (function (dir) {
    var isEmptyDir = fs_1.default.readdirSync(dir).length === 0;
    var indexFilePath = path_1.default.join(dir, 'index.ts');
    if (isEmptyDir && !fs_1.default.existsSync(indexFilePath)) {
        fs_1.default.writeFileSync(indexFilePath, "export type Methods = {\n  get: {\n    resBody: string\n  }\n}\n", 'utf8');
    }
    var controllerFilePath = path_1.default.join(dir, 'controller.ts');
    if (isEmptyDir && !fs_1.default.existsSync(controllerFilePath)) {
        fs_1.default.writeFileSync(controllerFilePath, "import { defineController } from './$relay'\n\nexport default defineController(() => ({\n  get: () => ({ status: 200, body: 'Hello' })\n}))\n", 'utf8');
    }
    var hooksFilePath = path_1.default.join(dir, 'hooks.ts');
    if (fs_1.default.existsSync(hooksFilePath) && !fs_1.default.readFileSync(hooksFilePath, 'utf8')) {
        fs_1.default.writeFileSync(hooksFilePath, "import { defineHooks } from './$relay'\n\nexport default defineHooks(() => ({\n  onRequest: (req, reply, done) => {\n    console.log('Directory level onRequest hook:', req.url)\n    done()\n  }\n}))\n", 'utf8');
    }
});
//# sourceMappingURL=createDefaultFilesIfNotExists.js.map