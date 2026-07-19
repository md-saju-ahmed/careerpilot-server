import { Document, Schema, model } from "mongoose";

export const SETTINGS_KEY = "platform";

export const SETTINGS_DEFAULTS = {
  siteName: "CareerPilot",
  supportEmail: "support@careerpilot.ai",
  maintenanceMode: false,
  allowRegistrations: true,
};

export interface SettingsDocument extends Document {
  key: string;
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    siteName: { type: String, default: SETTINGS_DEFAULTS.siteName },
    supportEmail: { type: String, default: SETTINGS_DEFAULTS.supportEmail },
    maintenanceMode: {
      type: Boolean,
      default: SETTINGS_DEFAULTS.maintenanceMode,
    },
    allowRegistrations: {
      type: Boolean,
      default: SETTINGS_DEFAULTS.allowRegistrations,
    },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.key;
        return ret;
      },
    },
  },
);

export const Settings = model<SettingsDocument>("Settings", settingsSchema);
