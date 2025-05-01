
import * as vscode from 'vscode';
import * as path from 'path';
import { readdir } from 'fs/promises';


export class FileSystemHandler {

    public static async* getFolders(dirUri: vscode.Uri, allowedFileExtensions: string[]): AsyncGenerator<vscode.Uri> {
        /* TODO: Change to vscode.workspace.fs.readDirectory */
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

    public static getRelativePath(basePath: vscode.Uri, uri: vscode.Uri): string {
        const pathSymbol = process.platform === 'win32' ? ".\\" : "./";
        return pathSymbol + path.relative(basePath.fsPath, uri.fsPath);
    }

    public static resolveWorkspaceFolder(input: string): string {
        if (!vscode.workspace.workspaceFolders) { return input; }

        let path = input;
        const workspaceFolder = "${workspaceFolder}";

        if (input.includes(workspaceFolder)) {
            let resolvedWorkspacePath = "";
            let workspaceUris = vscode.workspace.workspaceFolders.flatMap((workspaceFolder) => { return workspaceFolder.uri; });

            if (!workspaceUris) { return input; }

            for (let workspaceUri of workspaceUris) {
                const workspace = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(input.replace(workspaceFolder, workspaceUri.fsPath)));
                if (workspace) {
                    resolvedWorkspacePath = workspace.uri.fsPath;
                    break;
                }
            }
            path = input.replace(workspaceFolder, resolvedWorkspacePath);
        }

        return path;
    }

    public static getFileExtension(fileUri: vscode.Uri): string {
        return path.extname(fileUri.fsPath);
    }
}