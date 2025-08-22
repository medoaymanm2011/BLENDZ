import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  verified: boolean;
  active: boolean;
  verificationCode?: string | null;
  cart: { product: string; qty: number }[];
  wishlist: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    verificationCode: { type: String, default: null },
    cart: {
      type: [
        new Schema(
          {
            product: { type: String, required: true },
            qty: { type: Number, required: true, min: 1, default: 1 },
          },
          { _id: false }
        )
      ],
      default: []
    },
    wishlist: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
