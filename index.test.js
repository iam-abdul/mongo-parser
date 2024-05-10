import { expect, it } from "vitest";
import extractModel from "./index.js";

it("should be able to extract simple model", () => {
  const fileContent = `
import mongoose from "mongoose";
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
    `;

  const result = extractModel(fileContent);
  console.log(result);
  expect(result).toEqual([
    {
      model: "User",
      jsSchemaName: "UserSchema",
      schema: {
        name: {
          type: "String",
          required: true,
        },
        email: {
          type: "String",
          required: true,
          unique: true,
        },
        password: {
          type: "String",
          required: true,
        },
        date: {
          type: "Date",
          default: "Date.now",
        },
      },
      nodeId: 3,
    },
  ]);
});

it("should be able to extract model with reference", () => {
  const fileContent = `
import mongoose from "mongoose";
 const Schema = mongoose.Schema;
 const postSchema = new Schema({
    user: {
      type: Schema.Types.fake.ObjectId,
      ref: 'User',
      required: true,
    },
    title: [{
      type: String,
      required: true,
    }],
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    comments: [{
      text: {
        type: String,
        required: true,
      },
      postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  });
  const Post = mongoose.model('Post', postSchema);
    `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Post",
      jsSchemaName: "postSchema",
      schema: {
        user: {
          type: "Schema.Types.fake.ObjectId",
          ref: "User",
          required: true,
        },
        title: [
          {
            type: "String",
            required: true,
          },
        ],
        content: {
          type: "String",
          required: true,
        },
        date: {
          type: "Date",
          default: "Date.now",
        },
        comments: [
          {
            text: {
              type: "String",
              required: true,
            },
            postedBy: {
              type: "Schema.Types.ObjectId",
              ref: "User",
            },
          },
        ],
      },
      nodeId: 3,
    },
  ]);
});

it("should be able to identify the reassigned schema", () => {
  const fileContent = `
import mongoose from "mongoose";
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
})

UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        },
    });
  
const User = mongoose.model("User", UserSchema);
    `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "User",
      jsSchemaName: "UserSchema",
      schema: {
        firstName: {
          type: "String",
          required: true,
        },
      },
      nodeId: 4,
    },
  ]);
});
