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

it("should be able to extract these kind of model declarations ", () => {
  const fileContent = `
  import { model, Schema } from "mongoose";
    const ApprovalHistorySchema = new Schema({
    company: { type: Schema.Types.ObjectId, required: true, ref: "Company" },
    brand: { type: Schema.Types.ObjectId, required: true, ref: "Brand" },
  });

  ApprovalHistorySchema.index({ company: 1 });
  ApprovalHistorySchema.index({ brand: 1 });
  ApprovalHistorySchema.index({ user_type: 1 });
  export default model("ApprovalHistory", ApprovalHistorySchema);
  `;

  const result = extractModel(fileContent);
  expect(result).toEqual([
    {
      model: "ApprovalHistory",
      jsSchemaName: "ApprovalHistorySchema",
      schema: {
        company: {
          type: "Schema.Types.ObjectId",
          required: true,
          ref: "Company",
        },
        brand: {
          type: "Schema.Types.ObjectId",
          required: true,
          ref: "Brand",
        },
      },
      nodeId: 5,
    },
  ]);
});

it("should be able to extract schema for const yoyo =  model(ApprovalHistory, ApprovalHistorySchema) ", () => {
  const fileContent = `
  import { model, Schema, Types } from "mongoose";

    
    const ApprovalHistorySchema: Schema = new Schema(
      {
        company: { type: Schema.Types.ObjectId, required: true, ref: "Company" },
        brand: { type: Schema.Types.ObjectId, required: true, ref: "Brand" },    
      }
    );
   

    const yoyo =  model("ApprovalHistory", ApprovalHistorySchema);
    export yoyo
    `;

  expect(extractModel(fileContent, true)).toEqual([
    {
      model: "ApprovalHistory",
      jsSchemaName: "ApprovalHistorySchema",
      schema: {
        company: {
          type: "Schema.Types.ObjectId",
          required: true,
          ref: "Company",
        },
        brand: {
          type: "Schema.Types.ObjectId",
          required: true,
          ref: "Brand",
        },
      },
      nodeId: 2,
    },
  ]);
});

it("should be able to extract the schema for typescript files ", () => {
  const fileContent = `
  import mongoose, { Document, Schema, InferSchemaType } from "mongoose";
  interface IUser {
    full_name: string;
    email: string;
    phone_number: string;
    otp: string;
    email_verified: boolean;
    phone_verified: boolean;
  }

  const userSchema = new Schema<IUser>({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, unique: true },
    otp: { type: String },
    email_verified: { type: Boolean, default: false },
    phone_verified: { type: Boolean, default: false },
  });

  const UserModel = mongoose.model<IUser>("User", userSchema);

  export { UserModel, IUser };
  `;

  const result = extractModel(fileContent, true);
  expect(result).toEqual([
    {
      model: "User",
      jsSchemaName: "userSchema",
      schema: {
        full_name: {
          type: "String",
          required: true,
        },
        email: {
          type: "String",
          required: true,
          unique: true,
        },
        phone_number: {
          type: "String",
          unique: true,
        },
        otp: {
          type: "String",
        },
        email_verified: {
          type: "Boolean",
          default: false,
        },
        phone_verified: {
          type: "Boolean",
          default: false,
        },
      },
      nodeId: 2,
    },
  ]);
});

it("should be able to ignore the ENUMs in the schema ", () => {
  const fileContent = `

import mongoose, { Schema } from "mongoose";

enum ECategory {
  CYCLES = "cycles",
  MUSICAL = "musical",
  PHOTOGRAPHY = "photography",
}


interface IRetailer {
  name: string;
  email: string;
  phoneNumber: string;
  otp: number;
  otp_expiry: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  shopDetails?: IShopDetails;
  bankDetails?: IBankDetails;
  proof?: IProof;
  rangeOfProducts?: IRangeOfProducts;
  returnPolicy?: IReturnPolicy;
  gearGuruSponsorship: boolean;
}

const retailerSchema = new Schema<IRetailer>({
  name: { type: String, required: true },
  email: { type: String, required: true }
});

const RetailerModel = mongoose.model<IRetailer>("Retailer", retailerSchema);

export { RetailerModel, IRetailer };


    `;

  const result = extractModel(fileContent, true);
  expect(result).toEqual([
    {
      model: "Retailer",
      jsSchemaName: "retailerSchema",
      schema: {
        name: {
          type: "String",
          required: true,
        },
        email: {
          type: "String",
          required: true,
        },
      },
      nodeId: 4,
    },
  ]);
});

it("should be able to extract the schema with referred enums [typescript]", () => {
  const fileContent = `
  import mongoose, { Schema } from "mongoose";

  enum ECategory {
    CYCLES = "cycles",
    MUSICAL = "musical",
    PHOTOGRAPHY = "photography",
  }
  
  
  interface IRetailer {
    name: string;
    email: string;
    phoneNumber: string;
    otp: number;
    otp_expiry: Date;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    shopDetails?: IShopDetails;
    bankDetails?: IBankDetails;
    proof?: IProof;
    rangeOfProducts?: IRangeOfProducts;
    returnPolicy?: IReturnPolicy;
    gearGuruSponsorship: boolean;
  }
  
  const retailerSchema = new Schema<IRetailer>({
    name: { type: String, required: true },
    email: { type: String, required: true }
    category: { type: String, enum:Object.values(ECategory), required: true },
  });
  
  const RetailerModel = mongoose.model<IRetailer>("Retailer", retailerSchema);
  
  export { RetailerModel, IRetailer };
  
`;

  const result = extractModel(fileContent, true);
  expect(result).toEqual([
    {
      model: "Retailer",
      jsSchemaName: "retailerSchema",
      schema: {
        name: {
          type: "String",
          required: true,
        },
        email: {
          type: "String",
          required: true,
        },
        category: {
          type: "String",
          required: true,
        },
      },
      nodeId: 4,
    },
  ]);
});

it("should be able to extract ENUM from schema files", () => {
  const fileContent = `
  import { model, Schema, Types } from "mongoose";
  const ApprovalHistorySchema: Schema = new Schema(
    {
      status: {
        type: String,
        enum: ["requested", "approved", "rejected", "on-hold", "reset"],
      },
    }
  );
  export default model("ApprovalHistory", ApprovalHistorySchema);
  `;
  const result = extractModel(fileContent, true);
  expect(result).toEqual([
    {
      model: "ApprovalHistory",
      jsSchemaName: "ApprovalHistorySchema",
      schema: {
        status: {
          type: "String",
          enum: ["requested", "approved", "rejected", "on-hold", "reset"],
        },
      },
      nodeId: 2,
    },
  ]);
});
