import fs from 'graceful-fs'
import { ExtraObject } from '../../types';

export class Config {
    static readonly CONFIG_PATH = './private/config.json';

    private static config: ExtraObject = {};
    private static latestModified = -1;

    static get(key: string) {
        let latestModified = fs.statSync(Config.CONFIG_PATH).mtimeMs;

        if(latestModified !== this.latestModified) {
            try {
                Config.config = JSON.parse(fs.readFileSync(Config.CONFIG_PATH).toString());
            }
            catch(e) {
                console.error(e);
            }
        }
        
        return Config.config[key] ?? null;
    }

    static set(key: string, value: any) {
        Config.config[key] = value;
        fs.writeFile(Config.CONFIG_PATH, JSON.stringify(Config.config, null, 4), () => {});
    }
}