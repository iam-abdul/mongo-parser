import { parse } from "acorn";
import fs from "fs";
/*
 * i will follow this format
 *    {
 *      model: string,
 *      schema:{
 *          key: string
 *    }
 *}
 */

const traverseMemberExpressionValue = (expressions) => {
  const propertName = expressions.property.name;
  let objectName = "";
  if (expressions.object.type === "MemberExpression") {
    objectName = traverseMemberExpressionValue(expressions.object);
  } else {
    objectName = expressions.object.name;
  }
  return `${objectName}.${propertName}`;
};

function traverseArguments(args) {
  let result = {};

  args.forEach((arg) => {
    if (arg.type === "Property") {
      let key = arg.key.name;
      let value;

      if (arg.value.type === "Identifier") {
        value = arg.value.name;
      } else if (arg.value.type === "Literal") {
        value = arg.value.value;
      } else if (arg.value.type === "ObjectExpression") {
        value = traverseArguments(arg.value.properties);
      } else if (arg.value.type === "MemberExpression") {
        value = traverseMemberExpressionValue(arg.value);
      } else if (arg.value.type === "ArrayExpression") {
        value = arg.value.elements.map((element) => {
          if (element.type === "ObjectExpression") {
            return traverseArguments(element.properties);
          }
        });
      }
      result[key] = value;
    }
  });

  return result;
}

const extractTheSchemaProperties = (args) => {
  const result = traverseArguments(args);
  // console.log("the result ", result);
  return result;
};

const findTheImmediateSchemaBeforeGivenNode = (
  nodeId,
  programBody,
  jsSchemaName
) => {
  // reverse loop
  for (let x = nodeId - 1; x >= 0; x--) {
    const thisNode = programBody[x];

    // it could also be a variable reassignment
    if (thisNode.type === "ExpressionStatement") {
      const thisNodeExpression = thisNode.expression;
      if (
        thisNodeExpression.type === "AssignmentExpression" &&
        thisNodeExpression.left.name === jsSchemaName
      ) {
        console.log("found the schema reassignment");
        const model = extractTheSchemaProperties(
          thisNodeExpression.right.arguments[0].properties
        );
        return model;
      }
    } else {
      const thisNodeDeclarations = thisNode.declarations;
      if (!thisNodeDeclarations) {
        console.log("no declarations");
        continue;
      }
      for (let y = 0; y < thisNodeDeclarations.length; y++) {
        const currentDeclaration = thisNodeDeclarations[y];

        if (
          currentDeclaration.type === "VariableDeclarator" &&
          currentDeclaration.id.name === jsSchemaName
        ) {
          const model = extractTheSchemaProperties(
            currentDeclaration.init.arguments[0].properties
          );

          return model;
        }
      }
    }
  }
};

const extractModelFromExpressionStatement = (expression) => {
  // this line is for finding the model declaration
  // it works for "module.exports =  mongoose.model("Admins", AdminSchema);"
  if (expression.type === "AssignmentExpression") {
    if (
      expression.right.type === "CallExpression" &&
      expression.right.callee.type === "MemberExpression" &&
      expression.right.callee.object.name === "mongoose" &&
      expression.right.callee.property.name === "model"
    ) {
      const modelName = expression.right.arguments[0].value;
      const jsSchemaName = expression.right.arguments[1].name;
      return {
        model: modelName,
        jsSchemaName,
      };
    }
  }
};

const extractModel = (fileContent) => {
  // parse model string
  const ast = parse(fileContent, {
    sourceType: "module",
  });

  fs.writeFileSync("ast.json", JSON.stringify(ast, null, 2));
  // filtering the model names
  const models = [];
  const programBody = ast.body;
  for (let x = 0; x < programBody.length; x++) {
    const thisNode = programBody[x];
    if (thisNode.declarations) {
      // this line is for finding the model declaration
      // it works for "const Post = mongoose.model("Post", postSchema);"
      const thisNodeDeclarations = thisNode.declarations;
      for (let y = 0; y < thisNodeDeclarations.length; y++) {
        const currentDeclaration = thisNodeDeclarations[y];
        if (
          currentDeclaration.type === "VariableDeclarator" &&
          currentDeclaration.init.type === "CallExpression" &&
          currentDeclaration.init.callee.type === "MemberExpression" &&
          currentDeclaration.init.callee.object.name === "mongoose" &&
          currentDeclaration.init.callee.property.name === "model"
        ) {
          const modelName = currentDeclaration.init.arguments[0].value;
          const jsSchemaName = currentDeclaration.init.arguments[1].name;
          const nodeId = x;

          /**
           * with this jsSchemaName, there could be multiple declarations
           * we need to find the immediate before declaration
           */

          const schema = findTheImmediateSchemaBeforeGivenNode(
            nodeId,
            programBody,
            jsSchemaName
          );
          models.push({
            model: modelName,
            jsSchemaName,
            schema: schema,
            nodeId,
          });
        }
      }
    } else if (thisNode.type === "ExpressionStatement") {
      const model = extractModelFromExpressionStatement(thisNode.expression);
      if (model) {
        const nodeId = x;
        const schema = findTheImmediateSchemaBeforeGivenNode(
          nodeId,
          programBody,
          model.jsSchemaName
        );
        models.push({
          model: model.model,
          jsSchemaName: model.jsSchemaName,
          schema: schema,
          nodeId,
        });
        console.log("model", model);
      }
    }
  }

  // fs.writeFileSync("ast.json", JSON.stringify(models, null, 2));

  return models;
};

const fileContent = `
const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const uniqueValidator = require("mongoose-unique-validator");

const AdminSchema = new mongoose.Schema({
    name: { type: String, default: null },
    // role: { type: String, enum: ['super-admin', 'executive', 'data-entry-operator'] },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Roles", default: null },
    email: { type: String, default: null, unique: true },
    phone: { type: Number, default: null },
    location: { type: String, default: null },
    address: { type: String, default: null },
    password: { type: String },
    image: { type: String, default: null },
    active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admins", default: null },
});

AdminSchema.plugin(timestamps);
AdminSchema.plugin(uniqueValidator);
// module.exports = mongoose.models.Admins || mongoose.model("Admins", AdminSchema);
module.exports =  mongoose.model("Admins", AdminSchema);
`;

console.log(JSON.stringify(extractModel(fileContent), null, 2));

export default extractModel;
