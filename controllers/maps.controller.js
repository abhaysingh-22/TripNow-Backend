import mapsService from "../services/maps.service.js";
import { validationResult } from "express-validator";

const geocode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { address } = req.query;

  try {
    const coordinates = await mapsService.getCoordinates(address);
    return res.status(200).json(coordinates);
  } catch (error) {
    console.error("Geocode error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getDistanceTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { origin, destination } = req.query;

  try {
    const distanceTime = await mapsService.getDistanceTime(origin, destination);
    return res.status(200).json(distanceTime);
  } catch (error) {
    console.error("Distance time error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getSuggestions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { input } = req.query;

  try {
    const suggestions = await mapsService.getSuggestions(input);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  geocode,
  getDistanceTime,
  getSuggestions,
};
