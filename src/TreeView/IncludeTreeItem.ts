import * as vscode from 'vscode';
import Include from '../Include';

export default class IncludeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly include: Include,
        public readonly label: string | vscode.TreeItemLabel,
        public readonly command: vscode.TreeItem["command"] | undefined,
        public readonly iconPath: vscode.ThemeIcon | undefined,
        public readonly resourceUri: vscode.Uri,
        public readonly collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.iconPath = iconPath;
        this.resourceUri = resourceUri;
        this.command = command;
    }
}