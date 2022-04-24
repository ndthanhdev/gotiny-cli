#!/usr/bin/env zx
import 'zx/globals';

import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import os from 'os';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $ } from 'zx';

import { OUT_DIR, readVersion, WORK_DIR } from './utils.mjs';


"use strict";

console.log("parsing argv");
const argv = yargs(hideBin(process.argv))
	.options("push", {
		type: "boolean",
		default: false,
	})
	.parseSync();

argv.ver = await readVersion(WORK_DIR);

console.log("argv", JSON.stringify(argv, null, 2));

const IS_WIN = os.type() === "Windows_NT";

if (IS_WIN) {
	$.shell = "nu";
}

// FIXME: add copy binaries

const VERSION = await readVersion();
const CHOCO_TOOLS_DIR = path.resolve(WORK_DIR, "misc/choco/tools");

async function copyBinaries() {
	console.log("Copying binaries");
	const Bin32 = path.join(OUT_DIR, `gotiny-${VERSION}-windows-386.exe`);
	const Bin64 = path.join(OUT_DIR, `gotiny-${VERSION}-windows-amd64.exe`);

	const Bin32Dest = path.join(CHOCO_TOOLS_DIR, `gotiny-386.exe`);
	const Bin64Dest = path.join(CHOCO_TOOLS_DIR, `gotiny-amd64.exe`);

	await $`cp ${Bin32} ${Bin32Dest}`;
	await $`cp ${Bin64} ${Bin64Dest}`;
}

await copyBinaries()

async function runWithVersion(version, runner) {
	const xmlPath = path.resolve(WORK_DIR, "misc/choco/gotiny.nuspec");

	let origin = await fs.readFile(xmlPath, {
		encoding: "utf-8",
	});

	const parser = new XMLParser();
	let jObj = parser.parse(origin);
	jObj.package.metadata.version = version;

	let versioned = origin.replace(/__VERSION_HERE__/g, version);

	let isError;
	let error;
	try {
		await fs.writeFile(xmlPath, versioned, {
			encoding: "utf-8",
		});

		await runner();
	} catch (e) {
		isError = true;
		error = e;
	}

	await fs.writeFile(xmlPath, origin, {
		encoding: "utf-8",
	});

	if (isError) {
		throw error;
	}
}

const SPEC_PATH = path.resolve(WORK_DIR, "misc/choco/gotiny.nuspec");

async function pack() {
	await $`choco pack ${SPEC_PATH} --out ${OUT_DIR}`;
}

await runWithVersion(VERSION, pack);

