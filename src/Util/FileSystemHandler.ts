
import * as vscode from 'vscode';
const { readdir } = require('fs').promises;


export class FileSystemHandler {

    public static async* getFolders(dir: vscode.Uri): AsyncGenerator<vscode.Uri> {
        const files = await readdir(dir.fsPath, { withFileTypes: true, recursive: true });
        for (const file of files) {
            if (file.isDirectory()) {
                yield vscode.Uri.file(file.path + "/" + file.name);
            }
        }
    }
}