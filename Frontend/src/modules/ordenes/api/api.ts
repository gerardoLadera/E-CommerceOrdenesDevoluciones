import axios from "axios";

export const API = axios.create({
  baseURL:"https://orders-query-833583666995.us-central1.run.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export const API_UPDATE = axios.create({
  baseURL:"https://orders-command-833583666995.us-central1.run.app",
  headers: {
    "Content-Type": "application/json",
  },
});
