import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: string; // Supabase ID
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    userId: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for performance
CommentSchema.index({ taskId: 1 });
CommentSchema.index({ userId: 1 });

// Transform _id to id when converting to JSON
CommentSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IComment>("Comment", CommentSchema);
