import * as vscode from 'vscode';
import Include from '../Include';

export default class IncludeTreeItem extends vscode.TreeItem {
    constructor(public include: Include, public label: string | vscode.TreeItemLabel, public collapsibleState?: vscode.TreeItemCollapsibleState) { super(label, collapsibleState); }
}