import { WritableStream } from "node:stream/web";
import retry from "async-retry";
import { SendMessage } from "./Webhook.js";
import { CHUNK_SIZE } from "./Constants.js";

interface UploadOptions {
  webhookUrl: string;
}

export interface UploadStatus {
  state: "uploading" | "done" | "aborted";
  transferredBytes: number;
}

export class Upload {
  private options: UploadOptions;
  private buffer: Uint8Array[];

  public links: string[];
  public stream: WritableStream;
  public status: UploadStatus;

  constructor(options: UploadOptions) {
    this.links = [];
    this.buffer = [];
    this.options = options;
    this.status = { state: "uploading", transferredBytes: 0 };
    this.stream = new WritableStream<Uint8Array>(
      {
        write: async (chunk) => {
          // If adding this chunk would overflow the buffer, flush it
          if (this.getBufferSize() + chunk.length > CHUNK_SIZE) {
            // flush
            await this.flushBuffer();
          }

          // Add chunk to buffer (consume it)
          this.buffer.push(chunk);
        },
        close: async () => {
          // Writer is done. Flush what we have in the buffer
          await this.flushBuffer();
          this.status.state = "done";
        },
        abort: async (reason) => {
          this.buffer = [];
          this.status.state = "aborted";
        },
      },
      {
        // The maximum amount of data we can handle in a single write() call
        highWaterMark: CHUNK_SIZE,
      }
    );
  }

  private getBufferSize() {
    return this.buffer.reduce((a, b) => a + b.length, 0);
  }

  private async flushBuffer() {
    await retry(
      async (bail) => {
        const { status, data } = await SendMessage(this.options.webhookUrl, {
          files: [{ name: "chunk", data: this.buffer }],
        });

        if (403 === status) {
          return bail(new Error("Unauthorized"));
        }

        // Error when uploading: no attachment sent
        if (!("attachments" in data)) {
          throw new Error(
            `Error while sending message: ${JSON.stringify(data)}`
          );
        }

        // The message has been sent successfully
        this.links.push(data.attachments[0].url);
      },
      { forever: true }
    );

    this.status.transferredBytes += this.getBufferSize();

    // Clear buffer
    this.buffer = [];
  }
}
