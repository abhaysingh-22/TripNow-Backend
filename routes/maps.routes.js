import express from "express";
import mapsController from "../controllers/maps.controller.js";
const router = express.Router();
import { authUser } from "../middlewares/auth.middleware.js";
import { query } from "express-validator";
import mapsService from "../services/maps.service.js";

router.get(
  "/geocode",
  authUser, // here we are authenticating the user becuase if not then we have to pay to google for the api requests
  // Validate the query parameter 'address'
  query("address").isString().notEmpty(),
  mapsController.geocode
);

router.get(
  "/distance-time",
  authUser, // here we are authenticating the user becuase if not then we have to pay to google for the api requests
  query("origin").isString().notEmpty(),
  query("destination").isString().notEmpty(),
  mapsController.getDistanceTime
);

router.get(
  "/suggestions",
  authUser,
  query("input").isString().notEmpty(),
  mapsController.getSuggestions
);

// // Add this test route:
// router.get("/test-geocoding", async (req, res) => {
//   try {
//     const { address } = req.query;
//     const testAddress =
//       address || "Pune International Airport, Maharashtra, India";

//     console.log("🧪 Testing geocoding for:", testAddress);
//     const result = await mapsService.getCoordinates(testAddress);

//     res.json({
//       success: true,
//       address: testAddress,
//       coordinates: result,
//       message: "Geocoding successful",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       address: req.query.address,
//     });
//   }
// });

export default router;
