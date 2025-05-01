import * as vscode from 'vscode';
import * as Path from 'path';

export default class Include {
    constructor(public fileUri: vscode.Uri, public includes: Include[] = []) { }

    public getFileName(): string {
        let returnString: string | undefined;
        returnString = this.fileUri.fsPath.split('\\').pop();
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