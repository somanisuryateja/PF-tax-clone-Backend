import 'dotenv/config';
import mongoose from 'mongoose';

const { MONGO_URI, MONGO_DB_NAME } = process.env;
const DATABASE_NAME = MONGO_DB_NAME && MONGO_DB_NAME.trim().length > 0 ? MONGO_DB_NAME : 'PF';

const exitWith = (code, message) => {
  if (message) {
    console.log(message);
  }
  process.exit(code);
};

const resetDatabase = async () => {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is required to reset the database.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { dbName: DATABASE_NAME });
    await mongoose.connection.dropDatabase();
    exitWith(0, `✅ Database "${DATABASE_NAME}" cleared successfully.`);
  } catch (error) {
    console.error('❌ Failed to reset database:', error.message ?? error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

resetDatabase();


