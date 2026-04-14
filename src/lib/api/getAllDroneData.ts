import axios from "axios";

const DRONE_API_URL = process.env.NEXT_PUBLIC_DRONE_RTC_API_URL || "";

export const getAllDroneData = async () => {
  const { data } = await axios.get(DRONE_API_URL);

  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch drone data");
  }

  return data;
};
