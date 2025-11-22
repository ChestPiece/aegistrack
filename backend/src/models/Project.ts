import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  title: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  deadline?: Date;
  createdBy: string; // Supabase ID of the creator
  members: string[]; // Array of Supabase IDs
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "archived"],
      default: "planning",
    },
    deadline: { type: Date },
    createdBy: { type: String, required: true },
    members: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IProject>("Project", ProjectSchema);
