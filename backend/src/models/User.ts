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

export default mongoose.model<IUser>("User", UserSchema);
