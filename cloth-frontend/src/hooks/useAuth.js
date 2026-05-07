import axios from "axios";

export const useAuth = () => {

  const login = async (username, password) => {

    const response = await axios.post("http://127.0.0.1:8000/token", {
      username: username,
      password: password
    });

    localStorage.setItem("token", response.data.access_token);

    return response.data;
  };

  return { login };
};