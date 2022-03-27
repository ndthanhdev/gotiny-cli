#!/usr/bin/env zx

"use strict";

import "zx/globals";
import path from "path";

const WORK_DIR = path.resolve(__dirname, "../..");

console.log("moving to root");
await cd(WORK_DIR);

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

console.log("parsing argv");
const argv = yargs(hideBin(process.argv))
  .options("ver", {
    alias: "v",
    demandOption: false,
  })
  .options("out", {
    default: "./out",
  })
  .option("makeTar", {
    type: "boolean",
    demandOption: false,
    default: false,
  })
  .option("genFormula", {
    type: "boolean",
    demandOption: false,
    default: false,
  })
  .parseSync();

console.log("argv", JSON.stringify(argv, null, 2));

const OUT_DIR = path.resolve(WORK_DIR, argv.out);

await $`rm -rf ${OUT_DIR}`;

await $`mkdir -p ${OUT_DIR}`;

import * as R from "ramda";

const OSs = ["windows", "linux", "darwin"];
const ARCHs = ["386", "x64", "arm", "arm64"];

let tapLog = (name) => R.tap((value) => console.log(name, value));

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
    await $`GOOS=${meta.os} GOARCCH=${meta.arch} go build -o ${meta.outPath}`.pipe(
      process.stdout
    );

    console.log("done:", meta.binName);
  }

  await Promise.all(metas.map(buildOne));
}

await buildAll(metas);

async function makeTars(metas) {
  metas = R.map((meta) => {
    let tarPath = meta.outPath + ".tar.gz";

    return {
      ...meta,
      tarPath,
    };
  });

  console.table(metas, ["binName", "tarPath"]);

  await Promise.all(metas.map(makeTar));

  return metas;

  async function makeTar(meta) {
    if (!["linux", "darwin"].includes(meta.os)) {
      return;
    }

    console.log("making tarball for", meta.binName);

    await $`tar -czf ${meta.tarPath} ${meta.outPath}`.pipe(process.stdout);
    console.log("done:", meta.binName);
  }
}

if (argv.makeTar) {
  console.log("making tarball");
  metas = await makeTars(metas);
} else {
  console.log("skipping making tarball");
}

import crypto from "crypto";
import fs from "fs";

async function genHash(metas) {
  async function genOne(path) {
    const fileBuffer = fs.readFileSync(path);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  metas = [...metas];

  let ps = metas.map(async (meta) => {
    let m = meta;
    m.hash = await genOne(m.outPath);
  });

  await Promise.all(ps);

  return metas;
}

async function genFormula(metas) {
  metas = await genHash(metas);

  console.table(metas, ["binName", "hash"]);

  let d = R.pipe(
    R.groupBy((meta) => meta.os),
    R.map(
      R.pipe(
        R.groupBy((meta) => meta.arch),
        R.map(R.nth(0))
      )
    )
  )(metas);

  console.log(JSON.stringify(d, null, 2));
  let ver = argv.ver;

  const formula = `
class Gotiny < Formula
    desc "Using gotiny.cc the lightweight, fast, secure URL shortener from the command line."
    homepage "https://github.com/ndthanhdev/gotiny-cli"
    license "MIT"
    version "v1.0.0"

    on_macos do
      if Hardware::CPU.arm?
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.darwin.arm64.binName}"
        sha256 "${d.darwin.arm64.hash}"
      else
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.darwin.x64.binName}"
        sha256 "${d.darwin.x64.hash}"
      end
    end

    on_linux do
      if Hardware::CPU.arm? and Hardware::CPU.is_64_bit?
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.linux.arm64.binName}"
        sha256 "${d.linux.arm64.hash}"
      elsif Hardware::CPU.arm?
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.linux.arm.binName}"
        sha256 "${d.linux.arm.hash}"
      elsif Hardware::CPU.is_64_bit?
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.linux.x64.binName}"
        sha256 "${d.linux.x64.hash}"
      else
        url "https://github.com/ndthanhdev/gotiny-cli/releases/download/${ver}/${d.linux["386"].binName}"
        sha256 "${d.linux["386"].hash}"
      end
    end

    def install
      on_macos do
        if Hardware::CPU.arm?
          bin.install "gotiny-${ver}-darwin-arm64" => "gotiny"
        else
          bin.install "gotiny-${ver}-darwin-x64" => "gotiny"
        end
      end

      on_linux do
        if Hardware::CPU.arm? and Hardware::CPU.is_64_bit?
          bin.install "gotiny-${ver}-linux-arm64" => "gotiny"
        elsif Hardware::CPU.arm?
          bin.install "gotiny-${ver}-linux-arm" => "gotiny"
        elsif Hardware::CPU.is_64_bit?
          bin.install "gotiny-${ver}-linux-x64" => "gotiny"
        else
          bin.install "gotiny-${ver}-linux-386" => "gotiny"
        end
      end
    end

    test do
      system bin/"gotiny", "--version"
    end
  end
`;

  let file = `${OUT_DIR}/gotiny.rb`;
  console.log("writing formula to", file);
  console.log(formula);
  fs.writeFileSync(file, formula, "utf-8");
  console.log("write done");
}

if (argv.ver && argv.genFormula) {
  console.log("generating formula");
  metas = genFormula(metas);
} else {
  console.log("skipping generating formula");
}
