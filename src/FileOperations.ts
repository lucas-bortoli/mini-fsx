import { WritableStream } from "node:stream/web";
import { setTimeout as sleep } from "node:timers/promises";

// Just under 7.99 MB
const CHUNK_SIZE = 8378122;

export const Download = () => {
  throw new Error("Not implemented.");
};

export const Upload = () => {
  const buffer: Uint8Array[] = [];
  const bufferSize = () => buffer.reduce((a, b) => a + b.length, 0);

  const flushBuffer = async () => {
    console.log("Flushing %d bytes", bufferSize());
    await sleep(900);
    buffer.length = 0;
  };

  return new WritableStream<Uint8Array>({
    write: async (chunk, controller) => {
      // If adding this chunk would overflow the buffer, flush it
      if (bufferSize() + chunk.length > CHUNK_SIZE) {
        // flush
        await flushBuffer();
      }

      // Add chunk to buffer (consume it)
      console.log("Consumed chunk size = %d.", chunk.length);
      buffer.push(chunk);

      // consume this chunk data
      await sleep(10);
    },
    close: async () => {
      // Writer is done. Flush what we have in the buffer
      console.log("Writer is done.");
      await flushBuffer();
    },
    abort: async (reason) => {
      console.warn("Upload aborted. Reason:", reason);
      buffer.length = 0;
    }
  }, {
    // The maximum amount of data we can handle in a single write() call
    highWaterMark: CHUNK_SIZE
  });
};
