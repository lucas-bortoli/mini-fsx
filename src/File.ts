/**
 * A remote file stored in Discord's server
 */
export interface File {
  /**
   * Version of the library that created the file
   */
  _version: 0;

  /**
   * When the file was uploaded for the first time; UTC datetime format
   */
  uploadTimestamp: string;

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
}
