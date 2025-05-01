
import * as vscode from 'vscode';
import * as path from 'path';


export class FileSystemHandler {

    public static async* getFolders(rootDir: vscode.Uri, allowedFileExtensions: string[]): AsyncGenerator<vscode.Uri> {
        const files: [string, vscode.FileType][] = await vscode.workspace.fs.readDirectory(rootDir);
        const folders = files.filter((file) => file[1] === vscode.FileType.Directory);

        for (let folder of folders) {
            const folderUri = vscode.Uri.joinPath(rootDir, folder[0]);
            const filesOfDir = await vscode.workspace.fs.readDirectory(folderUri);
            const dirHasAllowedFiles = filesOfDir.some((file) => {
                return allowedFileExtensions.includes(FileSystemHandler.getFileExtension(vscode.Uri.file(file[0])));
            });
            if (dirHasAllowedFiles) {
                yield folderUri;
            }
            yield* FileSystemHandler.getFolders(folderUri, allowedFileExtensions);
        };
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