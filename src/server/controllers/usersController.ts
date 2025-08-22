import { User, IUser } from '@/models/User';
import { updateUserSchema, type UpdateUserInput } from '@/server/validators/users';

export async function listUsers(): Promise<Pick<IUser, '_id' | 'name' | 'email' | 'role' | 'verified' | 'active' | 'createdAt' | 'updatedAt'>[]> {
  // Only non-admin users
  const users = await User.find({ role: 'user' }, 'name email role verified active createdAt updatedAt').sort({ createdAt: -1 }).lean();
  return users as any;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<IUser | null> {
  const data = updateUserSchema.parse(input);
  const user = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  return user as any;
}

export async function deleteUser(id: string): Promise<boolean> {
  const u = await User.findById(id).lean();
  if (!u) return false;
  if (u.role === 'admin') throw new Error('Cannot delete admin user');
  await User.findByIdAndDelete(id);
  return true;
}
