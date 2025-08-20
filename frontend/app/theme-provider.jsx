"use client"
import store from "../store";
import { Provider } from "react-redux";
const ThemeProvider = ({ children }) => {
  return (
    <>
      <Provider store={store}>
        <div suppressHydrationWarning>
          {children}
        </div>
      </Provider>
    </>
  );
};

export default ThemeProvider;