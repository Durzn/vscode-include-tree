import * as vscode from 'vscode';

export default class ConfigAccess {
    constructor() { }

    private getConfiguration() {
        return vscode.workspace.getConfiguration("include-tree", null);
    }

    public getCompilerUri(): vscode.Uri {
        const config = this.getConfiguration();
        let compilerPath: string = config.get("compilerUri", "");
        return vscode.Uri.file(compilerPath);
    }
}

export { ConfigAccess };