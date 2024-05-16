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

it("should also work with module.exports", () => {
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
  module.exports = mongoose.model("Admins", AdminSchema);
  
  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Admins",
      jsSchemaName: "AdminSchema",
      schema: {
        name: {
          type: "String",
          default: null,
        },
        roleId: {
          type: "mongoose.Schema.Types.ObjectId",
          ref: "Roles",
          default: null,
        },
        email: {
          type: "String",
          default: null,
          unique: true,
        },
        phone: {
          type: "Number",
          default: null,
        },
        location: {
          type: "String",
          default: null,
        },
        address: {
          type: "String",
          default: null,
        },
        password: {
          type: "String",
        },
        image: {
          type: "String",
          default: null,
        },
        active: {
          type: "Boolean",
          default: true,
        },
        isDeleted: {
          type: "Boolean",
          default: false,
        },
        created_by: {
          type: "mongoose.Schema.Types.ObjectId",
          ref: "Admins",
          default: null,
        },
      },
      nodeId: 6,
    },
  ]);
});

it("should be able to extract model with module.exports = ", () => {
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
  module.exports = mongoose.models.Admins || mongoose.model("Admins", AdminSchema);
  
  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Admins",
      jsSchemaName: "AdminSchema",
      schema: {
        name: {
          type: "String",
          default: null,
        },
        roleId: {
          type: "mongoose.Schema.Types.ObjectId",
          ref: "Roles",
          default: null,
        },
        email: {
          type: "String",
          default: null,
          unique: true,
        },
        phone: {
          type: "Number",
          default: null,
        },
        location: {
          type: "String",
          default: null,
        },
        address: {
          type: "String",
          default: null,
        },
        password: {
          type: "String",
        },
        image: {
          type: "String",
          default: null,
        },
        active: {
          type: "Boolean",
          default: true,
        },
        isDeleted: {
          type: "Boolean",
          default: false,
        },
        created_by: {
          type: "mongoose.Schema.Types.ObjectId",
          ref: "Admins",
          default: null,
        },
      },
      nodeId: 6,
    },
  ]);
});

it("should be able to find and assign the value of identifiers or variables in the schema", () => {
  const fileContent = `
  import mongoose from "mongoose";
  const Schema = mongoose.Schema;
  
  let comments = {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  };

  const postSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments
  });
  
  const Post = mongoose.model("Post", postSchema);
  export default Post;
  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Post",
      jsSchemaName: "postSchema",
      schema: {
        user: {
          type: "Schema.Types.ObjectId",
          ref: "User",
        },
        comments: {
          user: {
            type: "Schema.Types.ObjectId",
            ref: "User",
          },
        },
      },
      nodeId: 4,
    },
  ]);
});

it("should be able to extract the schema with variables in the schema", () => {
  const fileContent = `
  import mongoose from "mongoose";
  const Schema = mongoose.Schema;
  

  const content = {
    type: "String",
    required: true,
  };

  let comments = {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content
  };

  const postSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments
  });
  
  const Post = mongoose.model("Post", postSchema);
  export default Post;

  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Post",
      jsSchemaName: "postSchema",
      schema: {
        user: {
          type: "Schema.Types.ObjectId",
          ref: "User",
        },
        comments: {
          user: {
            type: "Schema.Types.ObjectId",
            ref: "User",
          },
          content: {
            type: "String",
            required: true,
          },
        },
      },
      nodeId: 5,
    },
  ]);
});

it("should be able to extract the schema with reassigned variables in the schema", () => {
  const fileContent = `
  import mongoose from "mongoose";
  const Schema = mongoose.Schema;
  

  let content = {
    type: "String",
    required: true,
  };

  let comments = {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content
  };

  content = {
    type: "String",
    required: false,
  };

  comments = {
    text: {
      type: "String",
      required: true,
    },
    content
  }

  const postSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments
  });
  
  const Post = mongoose.model("Post", postSchema);
  export default Post;

  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "Post",
      jsSchemaName: "postSchema",
      schema: {
        user: {
          type: "Schema.Types.ObjectId",
          ref: "User",
        },
        comments: {
          text: {
            type: "String",
            required: true,
          },
          content: {
            type: "String",
            required: false,
          },
        },
      },
      nodeId: 7,
    },
  ]);
});
