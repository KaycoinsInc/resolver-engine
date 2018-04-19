import request from "request";
import * as tmp from "tmp";
import * as fs from "fs";
import Debug from "debug";

import { SubResolver } from "./subresolver";

const debug = Debug("resolverengine:urlresolver");

export class UrlResolver implements SubResolver {
  constructor() {
    tmp.setGracefulCleanup();
  }

  resolve(what: string, options?: request.Options): Promise<string | null> {
    return new Promise((resolve, reject) => {
      tmp.file((err, path, fd) => {
        if (err) {
          reject(err);
        }
        debug("Created temporary file: ", path);

        const req = request({ url: what, ...options });
        req
          .on("response", response => {
            debug("Got response:", response.statusCode);
            if (response.statusCode >= 200 && response.statusCode <= 299) {
              req.pipe(fs.createWriteStream("", { autoClose: false, fd }));
            } else {
              reject(new Error(`${response.statusCode} ${response.statusMessage}`));
            }
          })
          .on("error", reject)
          .on("end", () => resolve(path));
      });
    });
  }
}