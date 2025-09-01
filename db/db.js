// import mongoose from "mongoose";

// const connectToDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("MongoDB connected");
//   } catch (error) {
//     console.error("MongoDB connection error:", error.message);
//     process.exit(1);
//   }
// };

// export default connectToDB;

import mongoose from "mongoose";

const connectToDB = async () => {
  // Check if MONGODB_URI is defined
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
    console.error("Please check your .env file");
    return;
  }

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`,
      {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      }
    );
    console.log(
      "Connected to MongoDB successfully",
      `${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    // Don't exit process in development, just log the error
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

export default connectToDB;
