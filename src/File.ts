/**
 * A remote file stored in Discord's server
 */
export interface File {
  /**
   * Version of the library that created the file
   */
  _version: 0;

  /**
   * File contents size
   */
  size: number;

  /**
   * File contents checksum
   */
  md5: string;

  /**
   * Links to the file chunks, in order
   */
  chunks: string[];

  /**
   * User-supplied comment
   */
  comment: string | null;

  /**
   * Is this file encrypted with a symmetric encryption algorithm? Once a file
   * is encrypted, the only way of changing its key is by re-uploading it.
   * Will need password for downloading and uploading.
   */
  encrypted: boolean;
}
