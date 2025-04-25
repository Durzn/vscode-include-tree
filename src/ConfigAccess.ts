import * as vscode from 'vscode';

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
        return this.getConfiguration().get("compilerUri", "");
    }

    public getExtensionMode(): ExtensionMode {
        const config = this.getConfiguration();
        let extensionMode: string = config.get("extensionMode", ExtensionMode.AUTOMATIC);
        return <ExtensionMode>extensionMode;
    }

    public getMaxIncludeDepth(): number {
        return this.getConfiguration().get("includeDepth", 20);
    }
}

export { ConfigAccess };