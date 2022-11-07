module.exports = {
  purge: ["./pages/**/*.tsx", "./components/**/*.tsx"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      animation: {
        shake: "shake 0.5s infinite ease-in-out",
      },
      keyframes: {
        shake: {
          "0%": {
            transform: "rotate(-1deg)",
          },
          "50%": {
            transform: "rotate(1deg)",
          },
          "100%": {
            transform: "rotate(-1deg)",
          },
        },
      },
    },
  },
  plugins: [],
  mode: "jit",
};
