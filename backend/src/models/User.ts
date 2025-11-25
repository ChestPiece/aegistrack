import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  supabaseId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: "admin" | "member";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String },
    avatarUrl: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { timestamps: true }
);

// Transform _id to id when converting to JSON
UserSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IUser>("User", UserSchema);
