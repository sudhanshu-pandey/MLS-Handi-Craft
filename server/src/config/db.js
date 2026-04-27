import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
        `Connected to Mongodb Database ${mongoose.connection.host}`
      );
  } catch (error) {
    console.log(`Mongodb Database Error ${error}`);
  }
};

export default connectDB;