import * as vscode from 'vscode';
import { FileSystemHandler } from './Util/FileSystemHandler';

export enum ExtensionMode {
    MANUAL = "manual",
    AUTOMATIC = "automatic"
}

export default class ConfigAccess {
    constructor() { }

    private getConfiguration() {
        return vscode.workspace.getConfiguration("include-tree", null);
    }

    public getCompilerPath(): string {
        return this.getConfiguration().get("compilerPath", "");
    }

    public getExtensionMode(): ExtensionMode {
        const config = this.getConfiguration();
        let extensionMode: string = config.get("extensionMode", ExtensionMode.AUTOMATIC);
        return <ExtensionMode>extensionMode;
    }

    public getMaxIncludeDepth(): number {
        return this.getConfiguration().get("includeDepth", 20);
    }

    public getScanWorkspaceForIncludes(): boolean {
        return this.getConfiguration().get("scanWorkspaceForIncludes", true);
    }

    public getAdditionalIncludes(): string[] {
        let paths = this.getConfiguration().get("additionalIncludes", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    public getExcludedIncludes(): string[] {
        let paths = this.getConfiguration().get("excludedIncludes", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    public getCompileCommandsPath(): string {
        let path = this.getConfiguration().get("compileCommandsPath", "");
        return FileSystemHandler.resolveWorkspaceFolder(path);
    }

    public getCachedDirectories(): string[] {
        let paths = this.getConfiguration().get("cachedDirectories", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    public getOpenFilesOnClick(): boolean {
        return this.getConfiguration().get("openFilesOnClick", true);
    }
}

export { ConfigAccess };