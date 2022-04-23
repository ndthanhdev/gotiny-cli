#!/usr/bin/env zx

"use strict";

import "zx/globals";
import path from "path";
import os from "os";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as fs from "fs/promises";
import * as R from "ramda";
import { $, cd } from "zx";
import { readVersion, WORK_DIR } from "./utils.mjs";
import yargs from "yargs";

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

const VERSION = await readVersion(WORK_DIR);

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

const NUPKG_PATH = path.resolve(WORK_DIR, "out", `gotiny.${VERSION}.nupkg`);
const SPEC_PATH = path.resolve(WORK_DIR, "misc/choco/gotiny.nuspec");

async function pack() {
	await $`choco pack ${SPEC_PATH} --out ${NUPKG_PATH}`;
}

await runWithVersion(VERSION, pack);

if (argv.push) {
	await $`choco push ${NUPKG_PATH} -s https://push.chocolatey.org/`;
}
