
import * as vscode from 'vscode';
const { readdir } = require('fs').promises;
import * as path from 'path';


export class FileSystemHandler {

    public static async* getFolders(dirUri: vscode.Uri, allowedFileExtensions: string[]): AsyncGenerator<vscode.Uri> {
        const files = await readdir(dirUri.fsPath, { withFileTypes: true, recursive: true });
        for (const file of files) {
            if (file.isDirectory()) {
                const innerFiles = await readdir(file.path + "/" + file.name, { withFileTypes: true });
                for (let innerFile of innerFiles) {
                    const extension = path.extname(innerFile.name);
                    if (allowedFileExtensions.includes(extension)) {
                        yield vscode.Uri.file(file.path + "/" + file.name);
                        break;
                    }
                }
            }
        }
    }
}