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
        return this.getConfiguration().get("additionalIncludes", []);
    }

    public getExcludedIncludes(): string[] {
        return this.getConfiguration().get("excludedIncludes", []);
    }

    public getCompileCommandsPath(): string {
        let path = this.getConfiguration().get("compileCommandsPath", "");
        return FileSystemHandler.resolveWorkspaceFolder(path);
    }
}

export { ConfigAccess };