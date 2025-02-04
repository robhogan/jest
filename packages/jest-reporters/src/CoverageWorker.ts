/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import exit = require('exit');
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import generateEmptyCoverage, {
  CoverageWorkerResult,
} from './generateEmptyCoverage';
import type {ReporterContextSerialized} from './types';

export type CoverageWorkerData = {
  config: Config.ProjectConfig;
  context: ReporterContextSerialized;
  globalConfig: Config.GlobalConfig;
  path: string;
};

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  exit(1);
});

export function worker({
  config,
  globalConfig,
  path,
  context,
}: CoverageWorkerData): Promise<CoverageWorkerResult | null> {
  return generateEmptyCoverage(
    fs.readFileSync(path, 'utf8'),
    path,
    globalConfig,
    config,
    context.changedFiles && new Set(context.changedFiles),
    context.sourcesRelatedToTestsInChangedFiles &&
      new Set(context.sourcesRelatedToTestsInChangedFiles),
  );
}
