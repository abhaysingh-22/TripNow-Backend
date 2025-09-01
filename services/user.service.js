import User from "../models/user.model.js";

export const createUser = async ({ firstName, lastName, email, password }) => {
  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required");
  }
  const user = new User({
    fullName: {
      firstName,
      lastName,
    },
    email,
    password,
  });
  return await user.save();
};
