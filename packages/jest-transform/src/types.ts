/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {RawSourceMap} from 'source-map';
import type {Config, TransformTypes} from '@jest/types';

export interface ShouldInstrumentOptions
  extends Pick<
    Config.GlobalConfig,
    | 'collectCoverage'
    | 'collectCoverageFrom'
    | 'collectCoverageOnlyFrom'
    | 'coverageProvider'
  > {
  changedFiles?: Set<string>;
  sourcesRelatedToTestsInChangedFiles?: Set<string>;
}

export interface Options
  extends ShouldInstrumentOptions,
    CallerTransformOptions {
  isInternalModule?: boolean;
}

// This is fixed in source-map@0.7.x, but we can't upgrade yet since it's async
interface FixedRawSourceMap extends Omit<RawSourceMap, 'version'> {
  version: number;
}

export type TransformedSource = {
  code: string;
  map?: FixedRawSourceMap | string | null;
};

export type TransformResult = TransformTypes.TransformResult;

export interface CallerTransformOptions {
  // names are copied from babel: https://babeljs.io/docs/en/options#caller
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
}

export interface ReducedTransformOptions extends CallerTransformOptions {
  instrument: boolean;
}

export interface RequireAndTranspileModuleOptions
  extends ReducedTransformOptions {
  applyInteropRequireDefault: boolean;
}

export type StringMap = Map<string, string>;

export interface TransformOptions<OptionType = unknown>
  extends ReducedTransformOptions {
  /** a cached file system which is used in jest-runtime - useful to improve performance */
  cacheFS: StringMap;
  config: Config.ProjectConfig;
  /** A stringified version of the configuration - useful in cache busting */
  configString: string;
  /** the options passed through Jest's config by the user */
  transformerConfig: OptionType;
}

export interface SyncTransformer<OptionType = unknown> {
  /**
   * Indicates if the transformer is capable of instrumenting the code for code coverage.
   *
   * If V8 coverage is _not_ active, and this is `true`, Jest will assume the code is instrumented.
   * If V8 coverage is _not_ active, and this is `false`. Jest will instrument the code returned by this transformer using Babel.
   */
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

export interface AsyncTransformer<OptionType = unknown> {
  /**
   * Indicates if the transformer is capable of instrumenting the code for code coverage.
   *
   * If V8 coverage is _not_ active, and this is `true`, Jest will assume the code is instrumented.
   * If V8 coverage is _not_ active, and this is `false`. Jest will instrument the code returned by this transformer using Babel.
   */
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

/**
 * We have both sync (`process`) and async (`processAsync`) code transformation, which both can be provided.
 * `require` will always use `process`, and `import` will use `processAsync` if it exists, otherwise fall back to `process`.
 * Meaning, if you use `import` exclusively you do not need `process`, but in most cases supplying both makes sense:
 * Jest transpiles on demand rather than ahead of time, so the sync one needs to exist.
 *
 * For more info on the sync vs async model, see https://jestjs.io/docs/code-transformation#writing-custom-transformers
 */
export type Transformer<OptionType = unknown> =
  | SyncTransformer<OptionType>
  | AsyncTransformer<OptionType>;

export type TransformerCreator<
  X extends Transformer<OptionType>,
  OptionType = unknown,
> = (options?: OptionType) => X;

/**
 * Instead of having your custom transformer implement the Transformer interface
 * directly, you can choose to export a factory function to dynamically create
 * transformers. This is to allow having a transformer config in your jest config.
 */
export type TransformerFactory<X extends Transformer> = {
  createTransformer: TransformerCreator<X>;
};
