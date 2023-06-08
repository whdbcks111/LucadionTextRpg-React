import fs from 'graceful-fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';

const TMP_DIR = tmpdir();

export async function saveJson(filepath: string, data: any, cb?: (err: Error) => void) {
    const tempName = 'lucadion.' + crypto.createHash('md5').update(filepath).digest('hex');
    const tempPath = join(TMP_DIR, tempName);
    const json = JSON.stringify(data, null, 4);

    await new Promise<Error | null>((resolve, reject) => {
        fs.writeFile(tempPath, json, err => {
            if(err) {
                resolve(err);
            }
            else {
                fs.rename(tempPath, filepath, err => {
                    resolve(err);
                });
            }
        });

    }) 

}