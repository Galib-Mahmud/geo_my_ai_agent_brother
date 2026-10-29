import mongoose from 'mongoose';
import { useMultiFileAuthState, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import { config } from '../config.js';

let MongoAuthModel = null;

async function initMongo() {
  if (!config.mongodbUri) return null;
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log('✅ Connected to MongoDB Atlas for persistent WhatsApp session!');
    }

    if (!MongoAuthModel) {
      const schema = new mongoose.Schema({
        key: { type: String, unique: true, index: true },
        value: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
      });
      MongoAuthModel = mongoose.models.WhatsAppAuth || mongoose.model('WhatsAppAuth', schema);
    }
    return MongoAuthModel;
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed, falling back to local storage:', err.message);
    return null;
  }
}

export async function getAuthState() {
  const model = await initMongo();

  if (!model) {
    // Fallback to local filesystem
    console.log('📁 Using local multi-file auth state (./auth_info_baileys)');
    return await useMultiFileAuthState('./auth_info_baileys');
  }

  // Use MongoDB-backed auth state
  console.log('☁️ Using MongoDB cloud auth state for persistent WhatsApp pairing');

  const readData = async (key) => {
    try {
      const doc = await model.findOne({ key });
      if (!doc?.value) return null;
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch (e) {
      return null;
    }
  };

  const writeData = async (key, data) => {
    try {
      const serialized = JSON.stringify(data, BufferJSON.replacer);
      await model.findOneAndUpdate(
        { key },
        { value: serialized, updatedAt: new Date() },
        { upsert: true }
      );
    } catch (e) {
      console.error(`Failed to write key ${key} to MongoDB:`, e.message);
    }
  };

  const removeData = async (key) => {
    try {
      await model.deleteOne({ key });
    } catch (e) {
      console.error(`Failed to remove key ${key} from MongoDB:`, e.message);
    }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              const value = await readData(`${type}-${id}`);
              if (value) {
                if (type === 'app-state-sync-key' && value) {
                  // Baileys requires proto reconstruction if needed
                }
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(key, value));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
  };
}
