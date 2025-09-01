import moongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const captainSchema = new moongoose.Schema({
  fullName: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  password: {
    type: String,
    required: true,
  },

  totalRides: {
    type: Number,
    default: 0,
  },

  totalEarnings: {
    type: Number,
    default: 0,
  },

  totalDistance: {
    type: Number,
    default: 0,
  },
  socketId: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: "captain", // Default role is "captain"
  },

  status: {
    type: String,
    enum: ["active", "inactive", "banned"],
    default: "active",
  },

  vehicle: {
    color: {
      type: String,
      required: true,
    },
    numberPlate: {
      type: String,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    typeofVehicle: {
      type: String,
      enum: ["car", "bike", "truck"],
      required: true,
    },
  },

  location: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
});

captainSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

captainSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

captainSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10); // this 10 indicate the number of rounds for hashing which higher the number more secure it is but also more time comsuming
};

const Captain = moongoose.model("Captain", captainSchema);

export default Captain;
