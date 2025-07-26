# include-tree README

Extension to visualize the include tree of files. Gives you two separate views of include trees:
- "Including / Who am I including" view
- "Includer / Who includes this file" view

## Features

- Get a tree view with the include tree of either your open text files or of specifically chosen files
- Clicking on a file in the Include Tree will open the file
- Pin tree of current file
- Two different views to switch between: View that shows the files the current file is including and view that shows the files that are including the current file

# Support
If you find this extension helpful, please consider supporting its development with a donation.  
Your contributions help me maintain and improve the extension over time. Every bit is appreciated and keeps this project going.

<a href='https://ko-fi.com/H2H4Q3C6N' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Requirements

You must have a compiler (currently: gcc, g++, clang, clang++) installed.
Your version of these compilers must support both the -fsyntax-only and -H switches.

## Getting Started

The setup to get started with this extension is quite easy.
All you have to do is set `include-tree.compilerPath` to one of the compilers mentioned in the requirements.
Then, you should be able to see an include tree in the VsCode view provided by the extension.
If not, refer to the chapter [In-depth look on features](#in-depth-look-on-features)

| Example                    | Description                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|![](assets/example.png)     | Show include graph of an opened file in a new VsCode view. See the parsed output of the compiler calls in a special VsCode output channel for the extension. |

## In-depth look on features

The extension will try its best to resolve includes, but since native compiler settings (i.e. -fsyntax-only and -H switches) are used, all the extension can do is guess. Its purpose is not to be yet another build system, but rely on compiler implementations.
The extension will parse the whole workspace for possible include files (and append them to the additional includes passed to the compiler) if `include-tree.scanWorkspaceForIncludes` is enabled.

Should you get compile errors in the output channel, you will have to do one of the following things:

1. (Recommended) Use a compile_commands.json as input for the extension via the `include-tree.compileCommandsPath` setting
2. Manually add the missing include paths via the `include-tree.additionalIncludes` setting

To check that everything is working as expected, you can always open the output channel that is created by the extension. Both the call to the compiler
and the output is redirected there.

## File caching

Caching directories brings two benefits:
- The tree does not need to be re-determined during runtime every time a file is selected
- Enables the "Who is including me" view

### Views

The "Who is including me / Includers" view only works for cached directories. Use the `include-tree.cachedDirectories` to include all the files you need this for.  
A sensible default here is the following, since usually the interesting files are somewhere within the workspace.

```json
{
    "include-tree.cachedDirectories": [
        "${workspaceFolder}/**"
    ]
}
```

#### Who am I including / Including View

Shows the tree from the view of the currently selected file.

<img src="assets/whoAmIIncludingView.png" alt="image" width="300"/>  

#### Who is including me / Includers View

Shows the includers of this file. Only works on cached directories.

<img src="assets/whoIsIncludingMeView.png" alt="image" width="300"/>  

## Extension Settings

This extension contributes the following settings:

| Setting                                   | Description                                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `include-tree.extensionMode`              | Mode to operate on. Automatic (default) shows the include tree of the currently active file in the editor. Manual always shows the tree explicitly requested by the user (via context menu in the file browser). |
| `include-tree.compileCommandsPath`        | Path to a compile_commands.json. This will resolve includes paths for link targets. Note that header files are not listed here, and thus a separate option (either additionalIncludes or scanWorkspaceForIncludes) must be used in combination. |
| `include-tree.compilerPath`               | Full path to the compiler executable. Alternative: Use the compiler name (e.g. gcc), so the first occurrence in the path is taken.                                                                               |
| `include-tree.maxIncludeDepth`            | The max include depth to scan. Beware of circular inclusions.                                                                                                                                                    |
| `include-tree.scanWorkspaceForIncludes`   | Whether to automatically include all headers present in the vscode workspace. Note that when this option is not used, header files will not be correctly resolved, as they are not listed in compile_commands.json files. You must specify all paths in the additionalIncludes settings then.  |
| `include-tree.additionalIncludes`         | Includes paths to scan for header locations.                                                                                                                                                                     |
| `include-tree.excludedIncludes`           | Paths not to scan for header locations. Must be absolute paths.                                                                                                                                                  |
| `include-tree.cachedDirectories`          | Directories where include trees should be cached and not be re-created on demand. Accepts glob patterns like ${workspaceFolder}/**                                                                                                                                                  |
| `include-tree.openFilesOnClick`          | Whether to open files when clicking on them in the tree view. Requires a restart of the extension to work. |

## Known Issues

None so far.

# Feature requests and bug reports
Please mail them to me at dev@durzn.com or create an issue in GitHub.