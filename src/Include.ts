import * as vscode from 'vscode';
import { randomUUID } from 'crypto';

export default class Include {
    constructor(public fileUri: vscode.Uri, public includes: Include[] = [], public id = randomUUID(), public parent?: Include) { }

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