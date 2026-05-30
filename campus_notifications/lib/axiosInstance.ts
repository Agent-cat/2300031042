import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://4.224.186.213/evaluation-service",
});
