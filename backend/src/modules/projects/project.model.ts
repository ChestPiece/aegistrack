import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  title: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  deadline?: Date;
  priority: "high" | "medium" | "low";
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
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    deadline: { type: Date },
    createdBy: { type: String, required: true },
    members: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes for performance (non-unique fields only, unique fields auto-indexed)
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ members: 1 });
ProjectSchema.index({ status: 1 });

// Transform _id to id when converting to JSON
ProjectSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IProject>("Project", ProjectSchema);
