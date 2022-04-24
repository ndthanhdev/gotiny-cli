#!/usr/bin/env zx
import "zx/globals";

import { XMLParser } from "fast-xml-parser";
import * as fs from "fs/promises";
import os from "os";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { $ } from "zx";

import { OUT_DIR, readVersion, WORK_DIR } from "./utils.mjs";

const VERSION = await readVersion();

const NUPKG_PATH = path.resolve(OUT_DIR, `gotiny.${VERSION}.nupkg`);
await $`choco push ${NUPKG_PATH} -s https://push.chocolatey.org/`;
