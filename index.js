import { parse } from "acorn";

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

const extractModel = (fileContent) => {
  // parse model string
  const ast = parse(fileContent, {
    sourceType: "module",
  });
  // filtering the model names
  const models = [];
  const programBody = ast.body;
  for (let x = 0; x < programBody.length; x++) {
    const thisNode = programBody[x];
    const thisNodeDeclarations = thisNode.declarations;
    if (!thisNodeDeclarations) continue;
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
        models.push({ model: modelName, jsSchemaName, schema: schema, nodeId });
      }
    }
  }

  // fs.writeFileSync("ast.json", JSON.stringify(models, null, 2));

  return models;
};

export default extractModel;
