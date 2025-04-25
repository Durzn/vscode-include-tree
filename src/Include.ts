import * as vscode from 'vscode';
import * as Path from 'path';

export default class Include {
    constructor(public fileUri: vscode.Uri, public includes: Include[] = []) { }

    public getAbsolutePath(): string {
        return Path.resolve(this.fileUri.fsPath);
    }

    public getRelativePath(rootPath: string): string {
        return "./" + Path.relative(rootPath, this.fileUri.fsPath);
    }

    public getFileName(): string {
        let returnString: string | undefined;
        returnString = this.getAbsolutePath().split('\\').pop();
        if (!returnString) {
            return "";
        }
        returnString = returnString.split('/').pop();
        if (!returnString) {
            return "";
        }
        return returnString;
    }
}