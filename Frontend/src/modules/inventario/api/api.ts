import axios from "axios";

const API = axios.create({
  baseURL: "https://catalogo-service-dcc3a7dgbja8b6dd.canadacentral-01.azurewebsites.net/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
