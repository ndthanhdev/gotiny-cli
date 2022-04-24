"use strict";
import path from "path";

export const WORK_DIR = path.resolve(__dirname, "../../");

export const OUT_DIR = path.resolve(WORK_DIR, "out");

export const OUT_CHOCO_DIR = path.resolve(WORK_DIR, "out-choco");

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
