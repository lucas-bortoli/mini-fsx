import { createReadStream, createWriteStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { Readable, Writable } from "node:stream";
import assert from "node:assert";
import "dotenv/config";

import { Download } from "./Download.js";
import { Upload } from "./Upload.js";
import { File } from "./File.js";

const main = async (command: string) => {
  if (command === "upload") {
    // input: file data
    // output: file description

    const inputFile = process.argv[3];
    const outputFile = process.argv[4];

    assert.ok(existsSync(inputFile), "Source file doesn't exist.");
    assert.ok(!existsSync(outputFile), "Target file exists. Refusing to overwrite.");

    const localFile = Readable.toWeb(createReadStream(inputFile, { encoding: "binary" }));
    const upload = new Upload({ webhookUrl: process.env.DISCORD_WEBHOOK_URL });

    localFile.pipeTo(upload.stream);

    while (upload.status.state === "uploading") {
      await sleep(100);
    }

    if (upload.status.state === "done") {
      const description: File = {
        _version: 0,
        uploadTimestamp: new Date().toUTCString(),
        chunks: upload.links,
        comment: "",
        md5: "",
        size: upload.status.transferredBytes,
      };

      writeFileSync(outputFile, JSON.stringify(description, null, "  "));
    }
  } else if (command === "download") {
    // input: file description
    // output: file data
    const inputFile = process.argv[3];
    const outputFile = process.argv[4];

    assert.ok(existsSync(inputFile), "Source file doesn't exist.");
    assert.ok(!existsSync(outputFile), "Target file exists. Refusing to overwrite.");

    const metaFile = JSON.parse(readFileSync(inputFile, { encoding: "utf-8" })) as File;
    const outputStream = Writable.toWeb(createWriteStream(outputFile));
    const download = new Download({ chunks: metaFile.chunks });

    download.stream.pipeTo(outputStream);

    while (download.status.state === "downloading") {
      await sleep(100);
    }
  } else {
    process.stdout.write(`
      $ fsx-cli <command>

      COMMANDS
        upload <file> <meta>   Uploads the file to the server. Writes to meta.
        download <meta> <file> Downloads the file from the server. Reads from meta.

      META FILE
        The "meta file" is a small JSON data file containing the description of a
        previously uploaded file. It contains the following fields:
          - The total file size;
          - A md5 checksum of the original file;
          - Links to each piece of the file, which are downloaded by this application

      AUTHOR
        fsx-cli was written by Lucas Vinicius de Bortoli Santos.

    `);

    process.exit(1);
  }
};

main(process.argv[2]);
