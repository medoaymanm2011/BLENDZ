import { Settings, ISettings } from '@/models/Settings';
import { settingsSchema, SettingsInput } from '@/server/validators/settings';

export async function getSettings(): Promise<ISettings | null> {
  const doc = await Settings.findOne({ key: 'default' }).lean();
  return doc as any;
}

export async function getOrCreateSettings(): Promise<ISettings> {
  let doc = await Settings.findOne({ key: 'default' });
  if (!doc) {
    doc = await Settings.create({ key: 'default', currencies: ['EGP'], defaultCurrency: 'EGP', payments: { cod: true, stripeEnabled: false }, shippingMethods: [] });
  }
  return doc.toObject();
}

export async function upsertSettings(input: SettingsInput): Promise<ISettings> {
  const data = settingsSchema.parse(input);
  const updated = await Settings.findOneAndUpdate(
    { key: 'default' },
    { $set: { ...data, key: 'default' } },
    { upsert: true, new: true }
  );
  return updated.toObject();
}
