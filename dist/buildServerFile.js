"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var addPrettierIgnore_1 = require("./addPrettierIgnore");
var createControllersText_1 = __importDefault(require("./createControllersText"));
var genHandlerText = function (isAsync) { return "\nconst ".concat(isAsync ? 'asyncM' : 'm', "ethodToHandler = (\n  methodCallback: ServerMethods<any, any>[LowerHttpMethod]\n): RouteHandlerMethod => ").concat(isAsync ? 'async ' : '', "(req, reply) => {\n  const data = ").concat(isAsync ? 'await ' : '', "methodCallback(req as any) as any\n\n  if (data.headers) reply.headers(data.headers)\n\n  reply.code(data.status).send(data.body)\n}\n"); };
exports.default = (function (input, project) {
    var _a = (0, createControllersText_1.default)("".concat(input, "/api"), project !== null && project !== void 0 ? project : input), imports = _a.imports, consts = _a.consts, controllers = _a.controllers;
    var hasNumberTypeQuery = controllers.includes('parseNumberTypeQueryParams(');
    var hasBooleanTypeQuery = controllers.includes('parseBooleanTypeQueryParams(');
    var hasOptionalQuery = controllers.includes(' callParserIfExistsQuery(');
    var hasNormalizeQuery = controllers.includes(' normalizeQuery');
    var hasTypedParams = controllers.includes(' createTypedParamsHandler(');
    var hasValidator = controllers.includes(' validateOrReject(');
    var hasMultipart = controllers.includes(' formatMultipartData(');
    var hasMethodToHandler = controllers.includes(' methodToHandler(');
    var hasAsyncMethodToHandler = controllers.includes(' asyncMethodToHandler(');
    var hasRouteShorthandOptions = controllers.includes(' as RouteShorthandOptions,');
    return {
        text: (0, addPrettierIgnore_1.addPrettierIgnore)("/* eslint-disable */".concat(hasMultipart
            ? "\nimport multipart, { FastifyMultipartAttactFieldsToBodyOptions, Multipart } from 'fastify-multipart'"
            : '').concat(hasValidator ? "\nimport { validateOrReject, ValidatorOptions } from 'class-validator'" : '', "\n").concat(hasValidator ? "import * as Validators from './validators'\n" : '').concat(imports).concat(hasMultipart ? "import type { ReadStream } from 'fs'\n" : '', "import type { LowerHttpMethod, AspidaMethods, HttpStatusOk, AspidaMethodParams } from 'aspida'\nimport type { FastifyInstance, RouteHandlerMethod").concat(hasNumberTypeQuery || hasBooleanTypeQuery || hasTypedParams || hasValidator || hasMultipart
            ? ', preValidationHookHandler'
            : '').concat(hasValidator ? ', FastifyRequest' : '').concat(hasRouteShorthandOptions ? ', RouteShorthandOptions' : '', " } from 'fastify'\n\nexport type FrourioOptions = {\n  basePath?: string\n").concat(hasValidator ? '  validator?: ValidatorOptions\n' : '').concat(hasMultipart ? '  multipart?: FastifyMultipartAttactFieldsToBodyOptions\n' : '', "}\n\ntype HttpStatusNoOk = 301 | 302 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 409 | 500 | 501 | 502 | 503 | 504 | 505\n\ntype PartiallyPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>\n\ntype BaseResponse<T, U, V> = {\n  status: V extends number ? V : HttpStatusOk\n  body: T\n  headers: U\n}\n\ntype ServerResponse<K extends AspidaMethodParams> =\n  | (K extends { resBody: K['resBody']; resHeaders: K['resHeaders'] }\n  ? BaseResponse<K['resBody'], K['resHeaders'], K['status']>\n  : K extends { resBody: K['resBody'] }\n  ? PartiallyPartial<BaseResponse<K['resBody'], K['resHeaders'], K['status']>, 'headers'>\n  : K extends { resHeaders: K['resHeaders'] }\n  ? PartiallyPartial<BaseResponse<K['resBody'], K['resHeaders'], K['status']>, 'body'>\n  : PartiallyPartial<\n      BaseResponse<K['resBody'], K['resHeaders'], K['status']>,\n      'body' | 'headers'\n    >)\n  | PartiallyPartial<BaseResponse<any, any, HttpStatusNoOk>, 'body' | 'headers'>\n").concat(hasMultipart
            ? "\ntype BlobToFile<T extends AspidaMethodParams> = T['reqFormat'] extends FormData\n  ? {\n      [P in keyof T['reqBody']]: Required<T['reqBody']>[P] extends Blob | ReadStream\n        ? Multipart\n        : Required<T['reqBody']>[P] extends (Blob | ReadStream)[]\n        ? Multipart[]\n        : T['reqBody'][P]\n    }\n  : T['reqBody']\n"
            : '', "\ntype RequestParams<T extends AspidaMethodParams> = Pick<{\n  query: T['query']\n  body: ").concat(hasMultipart ? 'BlobToFile<T>' : "T['reqBody']", "\n  headers: T['reqHeaders']\n}, {\n  query: Required<T>['query'] extends {} | null ? 'query' : never\n  body: Required<T>['reqBody'] extends {} | null ? 'body' : never\n  headers: Required<T>['reqHeaders'] extends {} | null ? 'headers' : never\n}['query' | 'body' | 'headers']>\n\nexport type ServerMethods<T extends AspidaMethods, U extends Record<string, any> = {}> = {\n  [K in keyof T]: (\n    req: RequestParams<T[K]> & U\n  ) => ServerResponse<T[K]> | Promise<ServerResponse<T[K]>>\n}\n").concat(hasNumberTypeQuery
            ? "\nconst parseNumberTypeQueryParams = (numberTypeParams: [string, boolean, boolean][]): preValidationHookHandler => (req, reply, done) => {\n  const query: any = req.query\n\n  for (const [key, isOptional, isArray] of numberTypeParams) {\n    const param = isArray ? (query[`${key}[]`] ?? query[key]) : query[key]\n\n    if (isArray) {\n      if (!isOptional && param === undefined) {\n        query[key] = []\n      } else if (!isOptional || param !== undefined) {\n        const vals = (Array.isArray(param) ? param : [param]).map(Number)\n\n        if (vals.some(isNaN)) {\n          reply.code(400).send()\n          return\n        }\n\n        query[key] = vals as any\n      }\n\n      delete query[`${key}[]`]\n    } else if (!isOptional || param !== undefined) {\n      const val = Number(param)\n\n      if (isNaN(val)) {\n        reply.code(400).send()\n        return\n      }\n\n      query[key] = val as any\n    }\n  }\n\n  done()\n}\n"
            : '').concat(hasBooleanTypeQuery
            ? "\nconst parseBooleanTypeQueryParams = (booleanTypeParams: [string, boolean, boolean][]): preValidationHookHandler => (req, reply, done) => {\n  const query: any = req.query\n\n  for (const [key, isOptional, isArray] of booleanTypeParams) {\n    const param = isArray ? (query[`${key}[]`] ?? query[key]) : query[key]\n\n    if (isArray) {\n      if (!isOptional && param === undefined) {\n        query[key] = []\n      } else if (!isOptional || param !== undefined) {\n        const vals = (Array.isArray(param) ? param : [param]).map(p => p === 'true' ? true : p === 'false' ? false : null)\n\n        if (vals.some(v => v === null)) {\n          reply.code(400).send()\n          return\n        }\n\n        query[key] = vals as any\n      }\n\n      delete query[`${key}[]`]\n    } else if (!isOptional || param !== undefined) {\n      const val = param === 'true' ? true : param === 'false' ? false : null\n\n      if (val === null) {\n        reply.code(400).send()\n        return\n      }\n\n      query[key] = val as any\n    }\n  }\n\n  done()\n}\n"
            : '').concat(hasOptionalQuery
            ? "\nconst callParserIfExistsQuery = (parser: OmitThisParameter<preValidationHookHandler>): preValidationHookHandler => (req, reply, done) =>\n  Object.keys(req.query as any).length ? parser(req, reply, done) : done()\n"
            : '').concat(hasNormalizeQuery
            ? "\nconst normalizeQuery: preValidationHookHandler = (req, _, done) => {\n  req.query = JSON.parse(JSON.stringify(req.query))\n  done()\n}\n"
            : '').concat(hasTypedParams
            ? "\nconst createTypedParamsHandler = (numberTypeParams: string[]): preValidationHookHandler => (req, reply, done) => {\n  const params = req.params as Record<string, string | number>\n\n  for (const key of numberTypeParams) {\n    const val = Number(params[key])\n\n    if (isNaN(val)) {\n      reply.code(400).send()\n      return\n    }\n\n    params[key] = val\n  }\n\n  done()\n}\n"
            : '').concat(hasValidator
            ? "\nconst createValidateHandler = (validators: (req: FastifyRequest) => (Promise<void> | null)[]): preValidationHookHandler =>\n  (req, reply) => Promise.all(validators(req)).catch(err => reply.code(400).send(err))\n"
            : '').concat(hasMultipart
            ? "\nconst formatMultipartData = (arrayTypeKeys: [string, boolean][]): preValidationHookHandler => (req, _, done) => {\n  const body: any = req.body\n\n  for (const [key] of arrayTypeKeys) {\n    if (body[key] === undefined) body[key] = []\n    else if (!Array.isArray(body[key])) {\n      body[key] = [body[key]]\n    }\n  }\n\n  Object.entries(body).forEach(([key, val]) => {\n    if (Array.isArray(val)) {\n      body[key] = (val as Multipart[]).map(v => v.file ? v : (v as any).value)\n    } else {\n      body[key] = (val as Multipart).file ? val : (val as any).value\n    }\n  })\n\n  for (const [key, isOptional] of arrayTypeKeys) {\n    if (!body[key].length && isOptional) delete body[key]\n  }\n\n  done()\n}\n"
            : '').concat(hasMethodToHandler ? genHandlerText(false) : '').concat(hasAsyncMethodToHandler ? genHandlerText(true) : '', "\nexport default (fastify: FastifyInstance, options: FrourioOptions = {}) => {\n  const basePath = options.basePath ?? ''\n").concat(hasValidator
            ? '  const validatorOptions: ValidatorOptions = { validationError: { target: false }, ...options.validator }\n'
            : '').concat(consts, "\n").concat(hasMultipart
            ? '  fastify.register(multipart, { attachFieldsToBody: true, limits: { fileSize: 1024 ** 3 }, ...options.multipart })\n\n'
            : '').concat(controllers, "\n  return fastify\n}\n")),
        filePath: path_1.default.posix.join(input, '$server.ts')
    };
});
//# sourceMappingURL=buildServerFile.js.map