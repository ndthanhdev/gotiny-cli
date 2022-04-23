#!/usr/bin/env zx

"use strict";

import "zx/globals";
import path from "path";
import os from "os";

const IS_WIN = os.type() === "Windows_NT";

if (IS_WIN) {
	$.shell = "nu";
}

export const WORK_DIR = path.resolve(__dirname, "../..");

console.log("moving to root");
await cd(WORK_DIR);

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

console.log("parsing argv");
const argv = yargs(hideBin(process.argv))
	.options("out", {
		default: "./out",
	})
	.parseSync();

argv.ver = argv.ver || (await readVersion(WORK_DIR));

console.log("argv", JSON.stringify(argv, null, 2));

const OUT_DIR = path.resolve(WORK_DIR, argv.out);

await $`rm -rf ${OUT_DIR}`;

if (IS_WIN) {
	await $`mkdir ${OUT_DIR}`;
} else {
	await $`mkdir -p ${OUT_DIR}`;
}

import * as R from "ramda";
import { $ } from "zx";
import { readVersion } from "./utils/readVersion.mjs";

const OSs = ["windows", "linux", "darwin"];
const ARCHs = ["386", "amd64", "arm", "arm64"];

function buildBinName(meta) {
	let binName = "";

	binName += `${meta.os}-${meta.arch}`;

	if (meta.ver) {
		binName = `${meta.ver}-${binName}`;
	}

	if (["windows"].includes(meta.os)) {
		binName += ".exe";
	}

	binName = "gotiny-" + binName;

	return binName;
}

let metas = R.pipe(
	() => R.xprod(OSs, ARCHs),

	// darwin arm and arm64 are not existing
	R.difference(R.__, [
		["darwin", "arm"],
		["darwin", "386"],
	]),

	R.tap((metas) => {
		console.table(metas);
	}),

	R.map(([os, arch]) => ({
		os,
		arch,
		ver: argv.ver,
	})),

	R.map((meta) => ({ ...meta, binName: buildBinName(meta) })),

	R.map((meta) => ({ ...meta, outPath: path.resolve(OUT_DIR, meta.binName) })),

	R.tap((metas) => {
		console.table(metas, ["binName", "outPath"]);
	})
)();

async function buildAll(metas) {
	async function buildOne(meta) {
		await $`GOOS=${meta.os} GOARCH=${meta.arch} go build -o ${meta.outPath}`.pipe(
			process.stdout
		);

		console.log("done:", meta.binName);
	}

	await Promise.all(metas.map(buildOne));
}

await buildAll(metas);

console.log("done");
