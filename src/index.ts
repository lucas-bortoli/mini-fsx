import { createReadStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { Download, Upload } from "./FileOperations.js";

const upload = Upload();

const fileStream = Readable.toWeb(
  createReadStream(join(process.cwd(), "data_12M.img"), {
    highWaterMark: 256 * 1024,
  })
);

fileStream.pipeTo(upload);
