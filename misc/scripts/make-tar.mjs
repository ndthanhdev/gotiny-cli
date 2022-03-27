#!/usr/bin/env zx

import "zx/globals";
import { echo } from "zx/experimental";
import path from "path";

let workDir = path.resolve(__dirname, "../..");

echo("moving to root");
await cd(workDir);

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

echo("parsing");
const argv = yargs(hideBin(process.argv))
  .option("dir", {
    type: "string",
    default: "./bin",
  })
  .option("os", {
    type: "array",
    default: '["linux", "darwin"]',
  })
  .parse();

let absDir = path.resolve(workDir, argv.dir);
echo("dir", absDir);
echo("os", argv.os);

let bins = String(await $`ls ${absDir}`)
  .split("\n")
  .map((v) => v.trim());

echo("bins:", bins);

bins = bins
  .filter((v) => {
    return argv.os.some((o) => v.indexOf(o) > -1);
  })
  .map((bin) => path.resolve(absDir, bin));

echo("bins:", bins);

for (const bin of bins) {
  await $`tar -czvf ${bin}.tar.gz ${bin}`;
}

await $`ls ${absDir}`;
