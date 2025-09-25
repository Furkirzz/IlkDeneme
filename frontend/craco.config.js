module.exports = {
  // Buraya override ayarlarınızı ekleyebilirsiniz.
  // Örneğin Tailwind kullanıyorsanız postcss eklersiniz.
  style: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
};