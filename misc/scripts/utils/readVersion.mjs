"use strict";
import path from "path";
import * as fs from "fs/promises";
import { WORK_DIR } from "./build";

export async function readVersion() {
	const rootGo = path.resolve(WORK_DIR, "cmd/root.go");

	let lines = await fs.readFile(rootGo, {
		encoding: "utf-8",
	});

	lines = lines.split(/\r?\n/);

	const versionRgx = /(?<=var Version = ).+/g;
	let versionLine = lines.find((line) => {
		return versionRgx.test(line);
	});

	if (!versionLine) {
		throw "Version line not found";
	}

	let verStr = versionLine.match(versionRgx)?.[0];
	if (!verStr) {
		throw "Version not found";
	}

	verStr = verStr.replaceAll(/\"/g, "");

	return verStr;
}
