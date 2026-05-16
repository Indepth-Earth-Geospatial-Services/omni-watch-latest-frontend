import axios from "axios";

import { DJI_CONFIG } from "../dji/config";

const DRONE_API_URL = `${DJI_CONFIG.OMNIWATCH_API_URL}/api/v1/drones`;

export const getAllDroneData = async () => {
  const { data } = await axios.get(DRONE_API_URL);

  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch drone data");
  }

  return data;
};
