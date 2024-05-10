# mongoose-parser: Extract Mongoose Models from File Content

### Description

The `mongoose-parser` package provides a streamlined way to extract Mongoose models from JavaScript files containing model definitions. This is particularly useful for documentation generation, code analysis, or refactoring tasks.

### Installation

Install `mongoose-parser` using npm:

```
npm install mongoose-parser
```

### Usage

Import the extractModel function from the package and pass the file content as a string to extract information about the defined Mongoose models.

Here's an example showing how to use mongoose-parser in your code:

```
import extractModel from "mongoose-parser"
# file content as string
const fileContent = `import mongoose from "mongoose";
const Schema = mongoose.Schema;
let UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model("User", UserSchema);
`
const models = extractModel(fileContent);

console.log(models)
//  [
//    {
//      model: "User",
//      jsSchemaName: "UserSchema",
//      schema: {
//        name: {
//          type: "String",
//          required: true,
//        },
//        email: {
//          type: "String",
//          required: true,
//          unique: true,
//        },
//        password: {
//          type: "String",
//          required: true,
//        },
//        date: {
//          type: "Date",
//          default: "Date.now",
//        },
//      },
//      nodeId: 3,
//    },
//  ]

```
