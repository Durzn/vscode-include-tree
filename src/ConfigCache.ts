import ConfigAccess, { ExtensionMode } from './ConfigAccess';
import { Compiler, Gcc } from './Compilers';

export default class ConfigCache {

    public configAccess: ConfigAccess;

    /* Config parameters */
    public compiler!: Compiler;
    public extensionMode!: ExtensionMode;
    public maxIncludeDepth!: number;


    constructor() {
        this.configAccess = new ConfigAccess();
        this.onConfigChange();
    }

    public onConfigChange() {
        /* Config parameters */
        this.compiler = getCompilerFromPath(this.configAccess.getCompilerPath());
        this.extensionMode = this.configAccess.getExtensionMode();
        this.maxIncludeDepth = this.configAccess.getMaxIncludeDepth();
    }
}

function getCompilerFromPath(path: string) {
    /* Only support Gcc for now */
    return new Gcc(path);
}

var configCache: ConfigCache = new ConfigCache();

export { configCache };