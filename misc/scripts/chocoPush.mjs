#!/usr/bin/env zx
import "zx/globals";

import path from "path";
import { $ } from "zx";

import { OUT_CHOCO_DIR, readVersion, IS_WIN } from "./utils.mjs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

if (IS_WIN) {
	$.shell = "nu";
}

if (!process.env.CHOCO_TOKEN) {
	console.error("CHOCO_TOKEN is not set");
	process.exit(1);
}

const VERSION = await readVersion();

if (IS_WIN) {
	await $`choco apikey --key $env.CHOCO_TOKEN --source https://push.chocolatey.org/`;
} else {
	await $`choco apikey --key $CHOCO_TOKEN --source https://push.chocolatey.org/`;
}

const NUPKG_PATH = path.resolve(OUT_CHOCO_DIR, `gotiny.${VERSION}.nupkg`);
await $`choco push ${NUPKG_PATH} -s https://push.chocolatey.org/`;
