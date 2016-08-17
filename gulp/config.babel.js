module.exports = (() => {

  var base = {
    sourceDirectory: 'src',
    targetDirectory: 'target'
  };

  var taskConfigurations = {

    autoRebuild: {
    },

    reloadExtensions: {
      // for Extensions Reloader (https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)
      triggerUri: "http://reload.extensions"
    },

    clean: {
    },

    build: {
      manifest: {
        directory: `${base.sourceDirectory}`,
        fileName: 'manifest.json'
      },
      buildDirectory: `${base.targetDirectory}/dist`,
      exclude: [
        `bower_components/**`,
        `components/**`
      ],
      include: [
        `bower_components/jquery/dist/jquery.js`
      ]
    },

    dist: {
    }
  };

  for (var task in taskConfigurations) {
    taskConfigurations[task].base = base;
  }
  return taskConfigurations;
})();
