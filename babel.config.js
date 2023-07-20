module.exports = function (api) {
  const babelEnv = api.env();
  api.cache(true);

  const plugins = [
    ["@babel/plugin-transform-flow-strip-types", { "loose": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes'],
      },
    ],
    ["@babel/plugin-proposal-private-methods", {
      "loose": true
    }]
  ];

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console']);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins
  };
};
