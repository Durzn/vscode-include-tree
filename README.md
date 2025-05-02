# include-tree README

Extension to visualize the include tree of files.

## Features

- Get a tree view with the include tree of either your open text files or of specifically chosen files
- Clicking on a file in the Include Tree will open the file

| Example                    | Description                               |
| -------------------------- | ----------------------------------------- |
|![](assets/example.png)     | Show include graph of a file              |

## Requirements

You must have a compiler (currently: gcc, g++, clang, clang++) installed and its path or its name must be set in the settings.

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

## Known Issues

None so far.

# Feature requests and bug reports
Please mail them to me at dev@durzn.com or create an issue in GitHub.

# Support
I'm working on projects like this extension in my free time. 
If you want to buy me a coffee to keep me awake for more work on my projects, I'd greatly appreciate it.

<a href='https://ko-fi.com/H2H4Q3C6N' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

I also gladly accept ``Ada`` over this address: ``addr1qyz4hp9a5m844c5dn7nz56vget0lcx2lxg9eg02x9nyg82m7306tyvjqygl08grv79tm2jw0sh9lg8nr5u0g0qvf2nlsw376z4``
