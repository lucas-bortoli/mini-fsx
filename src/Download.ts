import { ReadableStream } from "node:stream/web";
import retry from "async-retry";
import { CHUNK_SIZE } from "./Constants.js";

export interface DownloadOptions {
  /**
   * List of links to download
   */
  chunks: string[];
}

export interface DownloadStatus {
  state: "downloading" | "done";
  transferredBytes: number;
}

export class Download {
  private chunks: string[];
  private chunkIndex: number;

  public stream: ReadableStream;
  public status: DownloadStatus;
  
  constructor(options: DownloadOptions) {
    this.chunkIndex = 0;
    this.status = { state: "downloading", transferredBytes: 0 };
    this.chunks = options.chunks;
    this.stream = new ReadableStream<Uint8Array>(
      {
        pull: async (controller) => {
          const url = this.chunks[this.chunkIndex];

          if (!url) {
            this.status.state = "done";
            return controller.close();
          }

          const data = await retry<Uint8Array | undefined>(
            async (bail) => {
              const response = await fetch(url);

              if (response.status === 404) {
                bail(new Error(`${response.status} ${response.statusText}`));
                return;
              }

              if (response.status !== 200) {
                throw new Error(await response.text());
              }

              return new Uint8Array(await response.arrayBuffer());
            },
            { forever: true }
          );

          controller.enqueue(data!);
          this.status.transferredBytes += data!.byteLength;
          this.chunkIndex++;
        },
      },
      { highWaterMark: CHUNK_SIZE }
    );
  }
}
