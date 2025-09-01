import Captain from "../models/captain.model.js";

export const createCaptain = async ({
  firstName,
  lastName,
  color,
  numberPlate,
  capacity,
  typeofVehicle,
  email,
  password,
}) => {
  try {
    const captain = new Captain({
      fullName: {
        firstName,
        lastName,
      },
      email,
      password,
      vehicle: {
        color,
        numberPlate,
        capacity,
        typeofVehicle,
      },
    });
    await captain.save();
    return captain;
  } catch (error) {
    throw new Error("Error creating captain");
  }
};
