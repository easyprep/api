# Folder structure
  ```
  root/
    ├── _config/
    │   └── status.json
    ├── questions/
    │   └── */ 
    │       └── */ 
    │           └── index.json
    └── indexfiles/
        ├── index.json
        ├── data.json
        └── data-*.json
```
     
## `_config` 
This folder contains configuartion files containg data useful for server data manipulation.
> ### `status.json`
> contains fetch parameters and index file parameters

## `questions`
This folder contains all the questions and auto organized by there uuid.

## `indexfiles`
This folder contains all indexdata files use for synchronizing data, useful for app/client side.
> ### `index.json`
> Array of `data-*.json` files including `data.json`
> ### `data.json`
> Contains latest index data
> ### `data-*.json`
> Conatins prev index data. `*` represents creation time of the file.

