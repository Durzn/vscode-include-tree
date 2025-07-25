import * as vscode from 'vscode';
import IncludeTree from '../IncludeTree';
import Include from '../Include';
import IncludeTreeItem from './IncludeTreeItem';
import { configCache } from '../ConfigCache';

export default class IncludeTreeDataProvider implements vscode.TreeDataProvider<IncludeTreeItem> {
    private elements: IncludeTreeItem[] = [];
    private expandedElements = new Set<string>();

    constructor(private includeTree: IncludeTree | undefined = undefined) {
        this.setIncludeTree(includeTree);
    }

    public getTreeItem(element: IncludeTreeItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: IncludeTreeItem): Thenable<IncludeTreeItem[]> {
        let includes: Include[] = [];
        if (element) {
            includes = element.include.includes;
        } else {
            includes = this.getRootNodes();
        }
        const items = this.convertIncludesToIncludeTreeItems(includes);
        return Promise.resolve(items);
    }

    public getParent(element: IncludeTreeItem): IncludeTreeItem | null {
        if (element.include.parent) {
            return this.elements.find(item => item.include.id === element.include.parent?.id) || null;
        }
        return null;
    }


    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getElementById(elementId: string): IncludeTreeItem | undefined {
        return this.elements.find(element => element.include.id === elementId);
    }


    public setExpansionState(elementId: string, isExpanded: boolean): void {
        let element = this.elements.find(element => element.include.id === elementId);
        if (!element) { return; }
        if (isExpanded) {
            this.expandedElements.add(element.include.id);
        }
        else {
            this.expandedElements.delete(element.include.id);
        }
    }

    public clearExpansionState(): void {
        this.expandedElements.clear();
    }

    public setIncludeTree(includeTree: IncludeTree | undefined) {
        this.includeTree = includeTree;
        if (includeTree) {
            this.elements = this.convertIncludesToIncludeTreeItems(includeTree.flatten());
            this.clearExpansionState();
        }
        this.refresh();
    }

    public getExpandableElements(): IncludeTreeItem[] {
        let expandableItems: IncludeTreeItem[] = this.convertIncludesToIncludeTreeItems(this.getRootNodes());
        for (const id of this.expandedElements.values()) {
            const element = this.getElementById(id);
            if (!element) { continue; }

            const items = element.include.includes.filter(elem => elem.includes.length > 0);

            if (!items) { continue; }

            expandableItems.push(...this.convertIncludesToIncludeTreeItems(items));
        }
        return expandableItems;
    }

    private convertIncludesToIncludeTreeItems(includes: Include[]): IncludeTreeItem[] {
        let items: IncludeTreeItem[] = [];

        for (const include of includes) {
            const currentItemState = this.expandedElements.has(include.id) ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
            const collapsibleState = include.includes.length === 0 ? vscode.TreeItemCollapsibleState.None : currentItemState;
            let command: vscode.TreeItem["command"] | undefined = undefined;
            command = {
                'title': "Open file",
                'command': "include-tree.open",
                'tooltip': "Open file",
                'arguments': [include.fileUri]
            };
            const item = new IncludeTreeItem(include, include.getFileName(), command, vscode.ThemeIcon.File, include.fileUri, collapsibleState);
            items.push(item);
        }

        return items;
    }

    private getRootNodes(): Include[] {
        let includes: Include[] = [];

        if (this.includeTree) {
            includes = this.includeTree.includes[0].includes;
        }
        return includes;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<IncludeTreeItem | undefined | null | void> = new vscode.EventEmitter<IncludeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<IncludeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
}