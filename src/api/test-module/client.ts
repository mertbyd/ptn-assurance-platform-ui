import axios from "axios";

export const testModuleClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TEST_MODULE_API_URL || "http://localhost:5000",
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    testModuleClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete testModuleClient.defaults.headers.common["Authorization"];
  }
};

// ABP Result<T> interceptor
testModuleClient.interceptors.response.use(
  (response) => {
    // Return data directly, unwrap if it's an ABP envelope
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);
