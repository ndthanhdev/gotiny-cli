#!/usr/bin/env zx
import 'zx/globals';

import path from 'path';
import { $ } from 'zx';

import { OUT_CHOCO_DIR, readVersion } from './utils.mjs';

const VERSION = await readVersion();

const NUPKG_PATH = path.resolve(OUT_CHOCO_DIR, `gotiny.${VERSION}.nupkg`);
await $`choco push ${NUPKG_PATH} -s https://push.chocolatey.org/`;
