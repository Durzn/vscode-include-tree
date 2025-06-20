import ConfigAccess, { ExtensionMode } from './ConfigAccess';
import { Compiler, Dummy, GenericCompiler } from './Compilers';

export default class ConfigCache {

    public configAccess: ConfigAccess;

    /* Config parameters */
    public compiler!: Compiler;
    public extensionMode!: ExtensionMode;
    public maxIncludeDepth!: number;
    public scanWorkspaceForIncludes!: boolean;
    public additionalIncludes!: string[];
    public resolvedCompileCommandsPath!: string;
    public excludedIncludes!: string[];
    public cachedDirectories!: string[];
    public openFilesOnClick!: boolean;

    constructor() {
        this.configAccess = new ConfigAccess();
        this.onConfigChange();
    }

    public onConfigChange() {
        /* Config parameters */
        this.compiler = getCompilerFromPath(this.configAccess.getCompilerPath());
        this.extensionMode = this.configAccess.getExtensionMode();
        this.maxIncludeDepth = this.configAccess.getMaxIncludeDepth();
        this.scanWorkspaceForIncludes = this.configAccess.getScanWorkspaceForIncludes();
        this.additionalIncludes = this.configAccess.getAdditionalIncludes();
        this.resolvedCompileCommandsPath = this.configAccess.getCompileCommandsPath();
        this.excludedIncludes = this.configAccess.getExcludedIncludes();
        this.cachedDirectories = this.configAccess.getCachedDirectories();
        this.openFilesOnClick = this.configAccess.getOpenFilesOnClick();
    }
}

function getCompilerFromPath(path: string) {
    if (path.includes("clang++.exe") || path === "clang++" || path.includes("clang.exe") || path === "clang") {
        return new GenericCompiler(path);
    }
    else if (path.includes("g++.exe") || path === "g++" || path.includes("gcc.exe") || path === "gcc") {
        return new GenericCompiler(path);
    }

    return new Dummy(path);
}

var configCache: ConfigCache = new ConfigCache();

export { configCache };