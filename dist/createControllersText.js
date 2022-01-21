"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var typescript_1 = __importDefault(require("typescript"));
var createDefaultFilesIfNotExists_1 = __importDefault(require("./createDefaultFilesIfNotExists"));
var addPrettierIgnore_1 = require("./addPrettierIgnore");
var findRootFiles = function (dir) {
    return fs_1.default
        .readdirSync(dir, { withFileTypes: true })
        .reduce(function (prev, d) { return __spreadArray(__spreadArray([], __read(prev), false), __read((d.isDirectory()
        ? findRootFiles("".concat(dir, "/").concat(d.name))
        : d.name === 'hooks.ts' || d.name === 'controller.ts'
            ? ["".concat(dir, "/").concat(d.name)]
            : [])), false); }, []);
};
var initTSC = function (appDir, project) {
    var configDir = path_1.default.resolve(project.replace(/\/[^/]+\.json$/, ''));
    var configFileName = typescript_1.default.findConfigFile(configDir, typescript_1.default.sys.fileExists, project.endsWith('.json') ? project.split('/').pop() : undefined);
    var compilerOptions = configFileName
        ? typescript_1.default.parseJsonConfigFileContent(typescript_1.default.readConfigFile(configFileName, typescript_1.default.sys.readFile).config, typescript_1.default.sys, configDir)
        : undefined;
    var program = typescript_1.default.createProgram(findRootFiles(appDir), (compilerOptions === null || compilerOptions === void 0 ? void 0 : compilerOptions.options)
        ? { baseUrl: compilerOptions === null || compilerOptions === void 0 ? void 0 : compilerOptions.options.baseUrl, paths: compilerOptions === null || compilerOptions === void 0 ? void 0 : compilerOptions.options.paths }
        : {});
    return { program: program, checker: program.getTypeChecker() };
};
var createRelayFile = function (input, appText, additionalReqs, params) {
    var hasAdditionals = !!additionalReqs.length;
    var hasMultiAdditionals = additionalReqs.length > 1;
    var text = "/* eslint-disable */\nimport { Injectable, depend } from 'velona'\nimport type { FastifyInstance, onRequestHookHandler, preParsingHookHandler, preValidationHookHandler, preHandlerHookHandler } from 'fastify'\nimport type { Schema } from 'fast-json-stringify'\nimport type { HttpStatusOk } from 'aspida'\nimport type { ServerMethods } from '".concat(appText, "'\n").concat(hasMultiAdditionals
        ? additionalReqs
            .map(function (req, i) {
            return "import type { AdditionalRequest as AdditionalRequest".concat(i, " } from '").concat(req.replace(/^\.\/\./, '.'), "'\n");
        })
            .join('')
        : hasAdditionals
            ? "import type { AdditionalRequest } from '".concat(additionalReqs[0], "'\n")
            : '', "import type { Methods } from './'\n\n").concat(hasMultiAdditionals
        ? "type AdditionalRequest = ".concat(additionalReqs
            .map(function (_, i) { return "AdditionalRequest".concat(i); })
            .join(' & '), "\n")
        : '').concat(hasAdditionals
        ? 'type AddedHandler<T> = T extends (req: infer U, ...args: infer V) => infer W ? (req: U & Partial<AdditionalRequest>, ...args: V) => W : never\n'
        : '', "type Hooks = {\n").concat([
        ['onRequest', 'onRequestHookHandler'],
        ['preParsing', 'preParsingHookHandler'],
        ['preValidation', 'preValidationHookHandler'],
        ['preHandler', 'preHandlerHookHandler']
    ]
        .map(function (_a) {
        var _b = __read(_a, 2), key = _b[0], val = _b[1];
        return hasAdditionals
            ? "  ".concat(key, "?: AddedHandler<").concat(val, "> | AddedHandler<").concat(val, ">[]\n")
            : "  ".concat(key, "?: ").concat(val, " | ").concat(val, "[]\n");
    })
        .join(''), "}\ntype ControllerMethods = ServerMethods<Methods, ").concat(hasAdditionals ? 'AdditionalRequest & ' : '', "{").concat(params.length
        ? "\n  params: {\n".concat(params.map(function (v) { return "    ".concat(v[0], ": ").concat(v[1]); }).join('\n'), "\n  }\n")
        : '', "}>\n\nexport function defineRequestSchema<T extends { [U in keyof ControllerMethods]?: { [V in 'body' | 'querystring' | 'params' | 'headers']?: Schema } }>(methods: () => T) {\n  return methods\n}\n\nexport function defineResponseSchema<T extends { [U in keyof ControllerMethods]?: { [V in HttpStatusOk]?: Schema }}>(methods: () => T) {\n  return methods\n}\n\nexport function defineHooks<T extends Hooks>(hooks: (fastify: FastifyInstance) => T): (fastify: FastifyInstance) => T\nexport function defineHooks<T extends Record<string, any>, U extends Hooks>(deps: T, cb: (d: T, fastify: FastifyInstance) => U): Injectable<T, [FastifyInstance], U>\nexport function defineHooks<T extends Record<string, any>>(hooks: (fastify: FastifyInstance) => Hooks | T, cb?: (deps: T, fastify: FastifyInstance) => Hooks) {\n  return cb && typeof hooks !== 'function' ? depend(hooks, cb) : hooks\n}\n\nexport function defineController(methods: (fastify: FastifyInstance) => ControllerMethods): (fastify: FastifyInstance) => ControllerMethods\nexport function defineController<T extends Record<string, any>>(deps: T, cb: (d: T, fastify: FastifyInstance) => ControllerMethods): Injectable<T, [FastifyInstance], ControllerMethods>\nexport function defineController<T extends Record<string, any>>(methods: (fastify: FastifyInstance) => ControllerMethods | T, cb?: (deps: T, fastify: FastifyInstance) => ControllerMethods) {\n  return cb && typeof methods !== 'function' ? depend(methods, cb) : methods\n}\n");
    fs_1.default.writeFileSync(path_1.default.join(input, '$relay.ts'), (0, addPrettierIgnore_1.addPrettierIgnore)(text.replace(', {}', '').replace(' & {}', '')), 'utf8');
};
var getAdditionalResPath = function (input, name) {
    return fs_1.default.existsSync(path_1.default.join(input, "".concat(name, ".ts"))) &&
        /(^|\n)export .+ AdditionalRequest(,| )/.test(fs_1.default.readFileSync(path_1.default.join(input, "".concat(name, ".ts")), 'utf8'))
        ? ["./".concat(name)]
        : [];
};
var createFiles = function (appDir, dirPath, params, appPath, additionalRequestPaths) {
    var input = path_1.default.posix.join(appDir, dirPath);
    var appText = "../".concat(appPath);
    var additionalReqs = __spreadArray(__spreadArray([], __read(additionalRequestPaths.map(function (p) { return "./.".concat(p); })), false), __read(getAdditionalResPath(input, 'hooks')), false);
    (0, createDefaultFilesIfNotExists_1.default)(input);
    createRelayFile(input, appText, __spreadArray(__spreadArray([], __read(additionalReqs), false), __read(getAdditionalResPath(input, 'controller')), false), params);
    fs_1.default.readdirSync(input, { withFileTypes: true }).forEach(function (d) {
        var _a;
        return d.isDirectory() &&
            createFiles(appDir, path_1.default.posix.join(dirPath, d.name), d.name.startsWith('_')
                ? __spreadArray(__spreadArray([], __read(params), false), [[d.name.slice(1).split('@')[0], (_a = d.name.split('@')[1]) !== null && _a !== void 0 ? _a : 'string']], false) : params, appText, additionalReqs);
    });
};
exports.default = (function (appDir, project) {
    createFiles(appDir, '', [], '$server', []);
    var _a = initTSC(appDir, project), program = _a.program, checker = _a.checker;
    var hooksPaths = [];
    // txt    hooks    response request
    var controllers = [];
    var createText = function (dirPath, cascadingHooks) {
        var input = path_1.default.posix.join(appDir, dirPath);
        var source = program.getSourceFile(path_1.default.join(input, 'index.ts'));
        var results = [];
        var hooks = cascadingHooks;
        if (source) {
            var methods = typescript_1.default.forEachChild(source, function (node) {
                var _a;
                return (typescript_1.default.isTypeAliasDeclaration(node) || typescript_1.default.isInterfaceDeclaration(node)) &&
                    node.name.escapedText === 'Methods' &&
                    ((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m.kind === typescript_1.default.SyntaxKind.ExportKeyword; }))
                    ? checker.getTypeAtLocation(node).getProperties()
                    : undefined;
            });
            var hooksSource = program.getSourceFile(path_1.default.join(input, 'hooks.ts'));
            if (hooksSource) {
                var events = typescript_1.default.forEachChild(hooksSource, function (node) {
                    if (typescript_1.default.isExportAssignment(node)) {
                        return node.forEachChild(function (node) {
                            return typescript_1.default.isCallExpression(node) &&
                                node.forEachChild(function (node) {
                                    if (typescript_1.default.isMethodDeclaration(node) ||
                                        typescript_1.default.isArrowFunction(node) ||
                                        typescript_1.default.isFunctionDeclaration(node)) {
                                        return (node.body &&
                                            checker
                                                .getTypeAtLocation(node.body)
                                                .getProperties()
                                                .map(function (p) {
                                                var typeNode = p.valueDeclaration &&
                                                    checker.typeToTypeNode(checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration), undefined, undefined);
                                                return {
                                                    type: p.name,
                                                    isArray: typeNode
                                                        ? typescript_1.default.isArrayTypeNode(typeNode) || typescript_1.default.isTupleTypeNode(typeNode)
                                                        : false
                                                };
                                            }));
                                    }
                                });
                        });
                    }
                });
                if (events) {
                    hooks = __spreadArray(__spreadArray([], __read(cascadingHooks), false), [{ name: "hooks".concat(hooksPaths.length), events: events }], false);
                    hooksPaths.push("".concat(input, "/hooks"));
                }
            }
            if (methods === null || methods === void 0 ? void 0 : methods.length) {
                var controllerSource = program.getSourceFile(path_1.default.join(input, 'controller.ts'));
                var isPromiseMethods_1 = [];
                var ctrlHooksSignature = void 0;
                var resSchemaSignature = void 0;
                var reqSchemaSignature_1;
                if (controllerSource) {
                    isPromiseMethods_1 =
                        typescript_1.default.forEachChild(controllerSource, function (node) {
                            return typescript_1.default.isExportAssignment(node) &&
                                node.forEachChild(function (nod) {
                                    return typescript_1.default.isCallExpression(nod) &&
                                        checker
                                            .getSignaturesOfType(checker.getTypeAtLocation(nod.arguments[nod.arguments.length - 1]), typescript_1.default.SignatureKind.Call)[0]
                                            .getReturnType()
                                            .getProperties()
                                            .map(function (t) {
                                            var _a;
                                            return t.valueDeclaration &&
                                                ((_a = checker
                                                    .getSignaturesOfType(checker.getTypeOfSymbolAtLocation(t, t.valueDeclaration), typescript_1.default.SignatureKind.Call)[0]
                                                    .getReturnType()
                                                    .getSymbol()) === null || _a === void 0 ? void 0 : _a.getEscapedName()) === 'Promise' &&
                                                t.name;
                                        })
                                            .filter(function (n) { return !!n; });
                                });
                        }) || [];
                    var ctrlHooksNode_1;
                    var resSchemaNode_1;
                    var reqSchemaNode_1;
                    typescript_1.default.forEachChild(controllerSource, function (node) {
                        var _a, _b, _c, _d, _e, _f, _g;
                        if (typescript_1.default.isVariableStatement(node) &&
                            ((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m.kind === typescript_1.default.SyntaxKind.ExportKeyword; }))) {
                            ctrlHooksNode_1 =
                                (_b = node.declarationList.declarations.find(function (d) { return d.name.getText() === 'hooks'; })) !== null && _b !== void 0 ? _b : ctrlHooksNode_1;
                            resSchemaNode_1 =
                                (_c = node.declarationList.declarations.find(function (d) { return d.name.getText() === 'responseSchema'; })) !== null && _c !== void 0 ? _c : resSchemaNode_1;
                            reqSchemaNode_1 =
                                (_d = node.declarationList.declarations.find(function (d) { return d.name.getText() === 'requestSchema'; })) !== null && _d !== void 0 ? _d : reqSchemaNode_1;
                        }
                        else if (typescript_1.default.isExportDeclaration(node)) {
                            var exportClause = node.exportClause;
                            if (exportClause && typescript_1.default.isNamedExports(exportClause)) {
                                ctrlHooksNode_1 =
                                    (_e = exportClause.elements.find(function (el) { return el.name.text === 'hooks'; })) !== null && _e !== void 0 ? _e : ctrlHooksNode_1;
                                resSchemaNode_1 =
                                    (_f = exportClause.elements.find(function (el) { return el.name.text === 'responseSchema'; })) !== null && _f !== void 0 ? _f : resSchemaNode_1;
                                reqSchemaNode_1 =
                                    (_g = exportClause.elements.find(function (el) { return el.name.text === 'requestSchema'; })) !== null && _g !== void 0 ? _g : reqSchemaNode_1;
                            }
                        }
                    });
                    if (ctrlHooksNode_1) {
                        ctrlHooksSignature = checker.getSignaturesOfType(checker.getTypeAtLocation(ctrlHooksNode_1), typescript_1.default.SignatureKind.Call)[0];
                    }
                    if (resSchemaNode_1) {
                        resSchemaSignature = checker.getSignaturesOfType(checker.getTypeAtLocation(resSchemaNode_1), typescript_1.default.SignatureKind.Call)[0];
                    }
                    if (reqSchemaNode_1) {
                        reqSchemaSignature_1 = checker.getSignaturesOfType(checker.getTypeAtLocation(reqSchemaNode_1), typescript_1.default.SignatureKind.Call)[0];
                    }
                }
                var ctrlHooksEvents_1 = ctrlHooksSignature === null || ctrlHooksSignature === void 0 ? void 0 : ctrlHooksSignature.getReturnType().getProperties().map(function (p) {
                    var typeNode = p.valueDeclaration &&
                        checker.typeToTypeNode(checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration), undefined, undefined);
                    return {
                        type: p.name,
                        isArray: typeNode
                            ? typescript_1.default.isArrayTypeNode(typeNode) || typescript_1.default.isTupleTypeNode(typeNode)
                            : false
                    };
                });
                var genHookTexts_1 = function (event) {
                    var _a;
                    return __spreadArray(__spreadArray([], __read(hooks.reduce(function (prev, h) {
                        var ev = h.events.find(function (e) { return e.type === event; });
                        return ev ? __spreadArray(__spreadArray([], __read(prev), false), ["".concat(ev.isArray ? '...' : '').concat(h.name, ".").concat(event)], false) : prev;
                    }, [])), false), __read(((_a = ctrlHooksEvents_1 === null || ctrlHooksEvents_1 === void 0 ? void 0 : ctrlHooksEvents_1.map(function (e) {
                        return e.type === event
                            ? "".concat(e.isArray ? '...' : '', "ctrlHooks").concat(controllers.filter(function (c) { return c[1]; }).length, ".").concat(event)
                            : '';
                    })) !== null && _a !== void 0 ? _a : [])), false);
                };
                var resSchemaMethods_1 = resSchemaSignature === null || resSchemaSignature === void 0 ? void 0 : resSchemaSignature.getReturnType().getProperties().map(function (p) { return p.name; });
                var reqSchemaMethods_1 = reqSchemaSignature_1 === null || reqSchemaSignature_1 === void 0 ? void 0 : reqSchemaSignature_1.getReturnType().getProperties().map(function (p) { return p.name; });
                var genResSchemaText_1 = function (method) {
                    return "response: responseSchema".concat(controllers.filter(function (c) { return c[2]; }).length, ".").concat(method);
                };
                var genBodySchemaText_1 = function (method) {
                    return "body: requestSchema".concat(controllers.filter(function (c) { return c[3]; }).length, ".").concat(method, ".body");
                };
                var genQuerystringSchemaText_1 = function (method) {
                    return "querystring: requestSchema".concat(controllers.filter(function (c) { return c[3]; }).length, ".").concat(method, ".querystring");
                };
                var genParamsSchemaText_1 = function (method) {
                    return "params: requestSchema".concat(controllers.filter(function (c) { return c[3]; }).length, ".").concat(method, ".params");
                };
                var genHeadersSchemaText_1 = function (method) {
                    return "headers: requestSchema".concat(controllers.filter(function (c) { return c[3]; }).length, ".").concat(method, ".headers");
                };
                var getSomeTypeQueryParams_1 = function (typeName, query) {
                    return query.valueDeclaration &&
                        checker
                            .getTypeOfSymbolAtLocation(query, query.valueDeclaration)
                            .getProperties()
                            .map(function (p) {
                            var _a;
                            var typeString = p.valueDeclaration &&
                                checker.typeToString(checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration));
                            return typeString === typeName || typeString === "".concat(typeName, "[]")
                                ? "['".concat(p.name, "', ").concat(!!((_a = p.declarations) === null || _a === void 0 ? void 0 : _a.some(function (d) {
                                    return d.getChildren().some(function (c) { return c.kind === typescript_1.default.SyntaxKind.QuestionToken; });
                                })), ", ").concat(typeString === "".concat(typeName, "[]"), "]")
                                : null;
                        })
                            .filter(Boolean);
                };
                results.push(methods
                    .map(function (m) {
                    var _a, _b;
                    var props = m.valueDeclaration
                        ? checker.getTypeOfSymbolAtLocation(m, m.valueDeclaration).getProperties()
                        : [];
                    var query = props.find(function (p) { return p.name === 'query'; });
                    var numberTypeQueryParams = query && getSomeTypeQueryParams_1('number', query);
                    var booleanTypeQueryParams = query && getSomeTypeQueryParams_1('boolean', query);
                    var validateInfo = [
                        { name: 'query', val: query },
                        { name: 'body', val: props.find(function (p) { return p.name === 'reqBody'; }) },
                        { name: 'headers', val: props.find(function (p) { return p.name === 'reqHeaders'; }) }
                    ]
                        .filter(function (prop) { return !!prop.val; })
                        .map(function (_a) {
                        var _b;
                        var name = _a.name, val = _a.val;
                        return ({
                            name: name,
                            type: val.valueDeclaration &&
                                checker.getTypeOfSymbolAtLocation(val, val.valueDeclaration),
                            hasQuestion: !!((_b = val.declarations) === null || _b === void 0 ? void 0 : _b.some(function (d) { return d.getChildAt(1).kind === typescript_1.default.SyntaxKind.QuestionToken; }))
                        });
                    })
                        .filter(function (_a) {
                        var type = _a.type;
                        return type === null || type === void 0 ? void 0 : type.isClass();
                    });
                    var reqFormat = props.find(function (p) { return p.name === 'reqFormat'; });
                    var isFormData = ((reqFormat === null || reqFormat === void 0 ? void 0 : reqFormat.valueDeclaration) &&
                        checker.typeToString(checker.getTypeOfSymbolAtLocation(reqFormat, reqFormat.valueDeclaration))) === 'FormData';
                    var reqBody = props.find(function (p) { return p.name === 'reqBody'; });
                    var hooksTexts = ['onRequest', 'preParsing', 'preValidation', 'preHandler']
                        .map(function (key) {
                        var _a, _b;
                        if (key === 'preValidation') {
                            var texts_1 = __spreadArray(__spreadArray(__spreadArray([
                                (numberTypeQueryParams === null || numberTypeQueryParams === void 0 ? void 0 : numberTypeQueryParams.length)
                                    ? ((_a = query === null || query === void 0 ? void 0 : query.declarations) === null || _a === void 0 ? void 0 : _a.some(function (d) { return d.getChildAt(1).kind === typescript_1.default.SyntaxKind.QuestionToken; }))
                                        ? "callParserIfExistsQuery(parseNumberTypeQueryParams([".concat(numberTypeQueryParams.join(', '), "]))")
                                        : "parseNumberTypeQueryParams([".concat(numberTypeQueryParams.join(', '), "])")
                                    : '',
                                (booleanTypeQueryParams === null || booleanTypeQueryParams === void 0 ? void 0 : booleanTypeQueryParams.length)
                                    ? ((_b = query === null || query === void 0 ? void 0 : query.declarations) === null || _b === void 0 ? void 0 : _b.some(function (d) { return d.getChildAt(1).kind === typescript_1.default.SyntaxKind.QuestionToken; }))
                                        ? "callParserIfExistsQuery(parseBooleanTypeQueryParams([".concat(booleanTypeQueryParams.join(', '), "]))")
                                        : "parseBooleanTypeQueryParams([".concat(booleanTypeQueryParams.join(', '), "])")
                                    : '',
                                isFormData && (reqBody === null || reqBody === void 0 ? void 0 : reqBody.valueDeclaration)
                                    ? "formatMultipartData([".concat(checker
                                        .getTypeOfSymbolAtLocation(reqBody, reqBody.valueDeclaration)
                                        .getProperties()
                                        .map(function (p) {
                                        var _a;
                                        var node = p.valueDeclaration &&
                                            checker.typeToTypeNode(checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration), undefined, undefined);
                                        return node && (typescript_1.default.isArrayTypeNode(node) || typescript_1.default.isTupleTypeNode(node))
                                            ? "['".concat(p.name, "', ").concat(!!((_a = p.declarations) === null || _a === void 0 ? void 0 : _a.some(function (d) {
                                                return d
                                                    .getChildren()
                                                    .some(function (c) { return c.kind === typescript_1.default.SyntaxKind.QuestionToken; });
                                            })), "]")
                                            : undefined;
                                    })
                                        .filter(Boolean)
                                        .join(', '), "])")
                                    : ''
                            ], __read(genHookTexts_1('preValidation')), false), __read((query &&
                                __spreadArray(__spreadArray([], __read((numberTypeQueryParams !== null && numberTypeQueryParams !== void 0 ? numberTypeQueryParams : [])), false), __read((booleanTypeQueryParams !== null && booleanTypeQueryParams !== void 0 ? booleanTypeQueryParams : [])), false).some(function (t) { return t === null || t === void 0 ? void 0 : t.endsWith('true]'); }) &&
                                validateInfo.length
                                ? ['normalizeQuery']
                                : [])), false), [
                                validateInfo.length
                                    ? "createValidateHandler(req => [\n".concat(validateInfo
                                        .map(function (v) {
                                        return v.type
                                            ? "          ".concat(v.hasQuestion ? "Object.keys(req.".concat(v.name, " as any).length ? ") : '', "validateOrReject(Object.assign(new Validators.").concat(checker.typeToString(v.type), "(), req.").concat(v.name, " as any), validatorOptions)").concat(v.hasQuestion ? ' : null' : '')
                                            : '';
                                    })
                                        .join(',\n'), "\n        ])")
                                    : '',
                                dirPath.includes('@number')
                                    ? "createTypedParamsHandler(['".concat(dirPath
                                        .split('/')
                                        .filter(function (p) { return p.includes('@number'); })
                                        .map(function (p) { return p.split('@')[0].slice(1); })
                                        .join("', '"), "'])")
                                    : ''
                            ], false).filter(Boolean);
                            return texts_1.length
                                ? "".concat(key, ": ").concat(texts_1.length === 1
                                    ? texts_1[0].replace(/^\.+/, '')
                                    : "[\n        ".concat(texts_1.join(',\n        '), "\n      ]"))
                                : '';
                        }
                        var texts = genHookTexts_1(key).filter(Boolean);
                        return texts.length
                            ? "".concat(key, ": ").concat(texts.length === 1 ? texts[0].replace('...', '') : "[".concat(texts.join(', '), "]"))
                            : '';
                    })
                        .filter(Boolean);
                    return "  fastify.".concat(m.name, "(").concat(hooksTexts.length || (resSchemaMethods_1 === null || resSchemaMethods_1 === void 0 ? void 0 : resSchemaMethods_1.includes(m.name)) || (reqSchemaMethods_1 === null || reqSchemaMethods_1 === void 0 ? void 0 : reqSchemaMethods_1.includes(m.name))
                        ? '\n    '
                        : '').concat(dirPath
                        ? "`${basePath}".concat("/".concat(dirPath)
                            .replace(/\/_/g, '/:')
                            .replace(/@.+?($|\/)/g, '$1'), "`")
                        : "basePath || '/'", ",").concat(hooksTexts.length || (resSchemaMethods_1 === null || resSchemaMethods_1 === void 0 ? void 0 : resSchemaMethods_1.includes(m.name)) || (reqSchemaMethods_1 === null || reqSchemaMethods_1 === void 0 ? void 0 : reqSchemaMethods_1.includes(m.name))
                        ? "\n    {\n      ".concat((resSchemaMethods_1 === null || resSchemaMethods_1 === void 0 ? void 0 : resSchemaMethods_1.includes(m.name)) || (reqSchemaMethods_1 === null || reqSchemaMethods_1 === void 0 ? void 0 : reqSchemaMethods_1.includes(m.name))
                            ? "schema: {\n        ".concat((resSchemaMethods_1 === null || resSchemaMethods_1 === void 0 ? void 0 : resSchemaMethods_1.includes(m.name)) ? "".concat(genResSchemaText_1(m.name), ",") : '', "\n        ").concat((reqSchemaMethods_1 === null || reqSchemaMethods_1 === void 0 ? void 0 : reqSchemaMethods_1.includes(m.name))
                                ? (_b = (_a = reqSchemaSignature_1 === null || reqSchemaSignature_1 === void 0 ? void 0 : reqSchemaSignature_1.getReturnType().getProperty(m.name)) === null || _a === void 0 ? void 0 : _a.declarations) === null || _b === void 0 ? void 0 : _b.map(function (d) { return checker.getTypeAtLocation(d).getProperties().map(function (p) { return p.name; }); })[0].map(function (kind) {
                                    var txt = '';
                                    switch (kind) {
                                        case 'body':
                                            txt = genBodySchemaText_1(m.name);
                                            break;
                                        case 'querystring':
                                            txt = genQuerystringSchemaText_1(m.name);
                                            break;
                                        case 'params':
                                            txt = genParamsSchemaText_1(m.name);
                                            break;
                                        case 'headers':
                                            txt = genHeadersSchemaText_1(m.name);
                                            break;
                                    }
                                    return txt;
                                }).join(',\n      ')
                                : '', "\n      }").concat(hooksTexts.length ? ',\n      ' : '')
                            : '').concat(hooksTexts.join(',\n      '), "\n    }").concat(fs_1.default.readFileSync("".concat(input, "/$relay.ts"), 'utf8').includes('AdditionalRequest')
                            ? ' as RouteShorthandOptions'
                            : '', ",\n    ")
                        : ' ').concat(isPromiseMethods_1.includes(m.name) ? 'asyncMethodToHandler' : 'methodToHandler', "(controller").concat(controllers.length, ".").concat(m.name, ")").concat(hooksTexts.length || (resSchemaMethods_1 === null || resSchemaMethods_1 === void 0 ? void 0 : resSchemaMethods_1.includes(m.name))
                        ? '\n  '
                        : '', ")\n");
                })
                    .join('\n'));
                controllers.push(["".concat(input, "/controller"), !!ctrlHooksEvents_1, !!resSchemaMethods_1, !!reqSchemaMethods_1]);
            }
        }
        var childrenDirs = fs_1.default.readdirSync(input, { withFileTypes: true }).filter(function (d) { return d.isDirectory(); });
        if (childrenDirs.length) {
            results.push.apply(results, __spreadArray([], __read(childrenDirs
                .filter(function (d) { return !d.name.startsWith('_'); })
                .reduce(function (prev, d) { return __spreadArray(__spreadArray([], __read(prev), false), __read(createText(path_1.default.posix.join(dirPath, d.name), hooks)), false); }, [])), false));
            var value = childrenDirs.find(function (d) { return d.name.startsWith('_'); });
            if (value) {
                results.push.apply(results, __spreadArray([], __read(createText(path_1.default.posix.join(dirPath, value.name), hooks)), false));
            }
        }
        return results;
    };
    var text = createText('', []).join('\n');
    var ctrlHooks = controllers.filter(function (c) { return c[1]; });
    var resSchemas = controllers.filter(function (c) { return c[2]; });
    var reqSchemas = controllers.filter(function (c) { return c[3]; });
    return {
        imports: "".concat(hooksPaths
            .map(function (m, i) {
            return "import hooksFn".concat(i, " from '").concat(m.replace(/^api/, './api').replace(appDir, './api'), "'\n");
        })
            .join('')).concat(controllers
            .map(function (ctrl, i) {
            return "import controllerFn".concat(i).concat(ctrl[1] || ctrl[2] || ctrl[3]
                ? ", { ".concat(ctrl[1] ? "hooks as ctrlHooksFn".concat(ctrlHooks.indexOf(ctrl)) : '').concat(((ctrl[1] && ctrl[2]) || (ctrl[1] && ctrl[3])) ? ', ' : '').concat(ctrl[2] ? "responseSchema as responseSchemaFn".concat(resSchemas.indexOf(ctrl)) : '').concat(((ctrl[2] && ctrl[1]) || (ctrl[2] && ctrl[3])) ? ', ' : '').concat(ctrl[3] ? "requestSchema as requestSchemaFn".concat(reqSchemas.indexOf(ctrl)) : '', " }")
                : '', " from '").concat(ctrl[0].replace(/^api/, './api').replace(appDir, './api'), "'\n");
        })
            .join('')),
        consts: "".concat(hooksPaths
            .map(function (_, i) { return "  const hooks".concat(i, " = hooksFn").concat(i, "(fastify)\n"); })
            .join('')).concat(ctrlHooks
            .map(function (_, i) { return "  const ctrlHooks".concat(i, " = ctrlHooksFn").concat(i, "(fastify)\n"); })
            .join('')).concat(resSchemas
            .map(function (_, i) { return "  const responseSchema".concat(i, " = responseSchemaFn").concat(i, "()\n"); })
            .join('')).concat(reqSchemas
            .map(function (_, i) { return "  const requestSchema".concat(i, " = requestSchemaFn").concat(i, "()\n"); })
            .join('')).concat(controllers
            .map(function (_, i) { return "  const controller".concat(i, " = controllerFn").concat(i, "(fastify)\n"); })
            .join('')),
        controllers: text
    };
});
//# sourceMappingURL=createControllersText.js.map