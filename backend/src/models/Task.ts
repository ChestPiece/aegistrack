import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  deadline?: Date;
  projectId: mongoose.Types.ObjectId;
  assignedTo?: string; // Supabase ID
  createdBy: string; // Supabase ID
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    deadline: { type: Date },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for performance
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ deadline: 1 });

// Transform _id to id when converting to JSON
TaskSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ITask>("Task", TaskSchema);
