Voyager
-------

__Recursively traverse a directory and yield a JSON tree of file sizes.__


Installation
============

Unix:

`sudo npm install JAForbes/voyager -g`

Windows:

`npm install JAForbes/voyager -g`

Command Line
============

```

  Usage: app [options]

  Recursively gather JSON filesize data

  Options:

    -h, --help                        output usage information
    -V, --version                     output the version number
    -f --file_relevance <bytes>       The minimum size a file can be for it to be included in the output
    -d --directory_relevance <bytes>  The minimum size a directory can be for it to be included in the output
    -r --relevance <bytes>            The minimum size a directory or a file can be for it to be included in the output
    -o --output <name>                The output path of the tree json
    -p --pretty                       Pretty print the JSON tree output
    -i --ignore <csv of patterns>     Case insensitive patterns to ignore

```

Node API Usage
==============

```js
var voyager = require('voyager')

voyager({

  // Tree data structure.  `name` property is the starting path
  // Best to leave this alone and just change the os cwd
  // defaults to './'

  tree: { name: './ '},

  // An array of patterns to ignore.
  // These get converted to RegEx's with the ignore flag
  // Ignoring folder can speed up the algorithm dramatically
  // defaults to []

  ignores: ['files','and','folders','to','ignore']

  // The smallest a file can be for it to be included in the output
  // This doesn't speed up the algorithm, just leave with less to sift through

  file_relevance: 0

  // The smallest a directory can be for it to be included in the output
  // This doesn't speed up the algorithm, just leaves you with less to sift through

  directory_relevance: 0

  // The smallest a directory or a file can be for it to be included in the output
  // This doesn't speed up the algorithm, just leaves you with less to sift through

  relevance: 0

}).then(function( tree ){

  //Use the tree here

})

```

Output JSON Format
==================

Voyager outputs a nested JSON tree.  Each branch of the tree has the following properties.

|Property     | Description
|-
| name        | The file path of the current branch
| children    | An array of branches that represent files and subdirectories of the current branch
| size        | The size of the file or directory in bytes
| isDirectory | A flag that states whether the current branch is a file or a directory


Here is the output of voyager run on its own source code directory, ignoring git and any files under 20mb

```
node app -i git -p -r 20000
```


```json

{
  "name": ".",
  "isDirectory": true,
  "size": 534233,
  "children": [
    {
      "name": "./node_modules",
      "size": 525229,
      "isDirectory": true,
      "children": [
        {
          "name": "./node_modules/commander",
          "size": 43327,
          "isDirectory": true,
          "children": [
            {
              "name": "./node_modules/commander/index.js",
              "size": 23039,
              "isDirectory": false
            }
          ]
        },
        {
          "name": "./node_modules/promise",
          "size": 27469,
          "isDirectory": true,
          "children": []
        },
        {
          "name": "./node_modules/ramda",
          "size": 454433,
          "isDirectory": true,
          "children": [
            {
              "name": "./node_modules/ramda/dist",
              "size": 238228,
              "isDirectory": true,
              "children": [
                {
                  "name": "./node_modules/ramda/dist/ramda.js",
                  "size": 216224,
                  "isDirectory": false
                },
                {
                  "name": "./node_modules/ramda/dist/ramda.min.js",
                  "size": 22004,
                  "isDirectory": false
                }
              ]
            },
            {
              "name": "./node_modules/ramda/src",
              "size": 203735,
              "isDirectory": true,
              "children": [
                {
                  "name": "./node_modules/ramda/src/internal",
                  "size": 25364,
                  "isDirectory": true,
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

```