const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Disable Mongoose command buffering when database connection is down
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`====================================================================`);
    console.error(`⚠️  DATABASE CONNECTION WARNING: MongoDB could not be reached!`);
    console.error(`Connection Error: ${error.message}`);
    console.error(`Please make sure your MongoDB server is running on local port 27017`);
    console.error(`====================================================================`);
  }
};

module.exports = connectDB;
