"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPrettierIgnore = void 0;
var addPrettierIgnore = function (text) {
    return text.replace(/\n([a-z])/g, '\n// prettier-ignore\n$1');
};
exports.addPrettierIgnore = addPrettierIgnore;
//# sourceMappingURL=addPrettierIgnore.js.map