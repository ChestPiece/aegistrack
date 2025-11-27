import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  supabaseId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  company?: string;
  bio?: string;
  location?: string;
  role: "admin" | "member";
  status: "pending" | "active";
  isActive: boolean;
  addedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String },
    avatarUrl: { type: String },
    phoneNumber: { type: String },
    company: { type: String },
    bio: { type: String },
    location: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "admin" },
    status: { type: String, enum: ["pending", "active"], default: "active" },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String }, // Supabase ID of the admin who added this user
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
