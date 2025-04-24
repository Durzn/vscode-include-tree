import Include from "./Include";
import IncludeTree from "./IncludeTree";
import * as vscode from 'vscode';

const { execFile } = require('child_process');

export interface Compiler {
    buildTree(fileUri: vscode.Uri): Promise<IncludeTree>;
}

export class Gcc implements Compiler {
    constructor(private compilerUri: vscode.Uri) {

    }

    async buildTree(fileUri: vscode.Uri): Promise<IncludeTree> {
        const stack: { depth: number; node: Include }[] = [];
        const rootNodes: Include[] = [];
        const { stdout, stderr } = await execFile(this.compilerUri.fsPath, ["-H", fileUri.fsPath]);
        const lines = stdout.split('\n');

        for (const line of lines) {
            const match = line.match(/^(\.+)(.+)$/);
            if (!match) { continue; };

            const depth = match[1].length;
            const name = match[2].trim();

            const node: Include = new Include(name, []);

            // Clean up stack to match current depth
            while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                stack.pop();
            }

            if (stack.length === 0) {
                rootNodes.push(node);
            } else {
                stack[stack.length - 1].node.includes.push(node);
            }

            stack.push({ depth, node });
        }

        return Promise.resolve(new IncludeTree(rootNodes));


    }
}