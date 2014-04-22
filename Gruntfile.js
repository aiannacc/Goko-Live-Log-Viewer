module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jst: {
      compile: {
        options: {
          processName: function (filepath) {
            return filepath.slice('src/templates/'.length, -'.html'.length);
          }
        },
        files: {
          'src/ext/templates.js': 'src/templates/**/*.html'
        }
      }
    },

    wrap: {
      templates: {
        src: 'src/ext/templates.js',
        dest: 'src/ext/templates.js',
        options: {
          wrapper: ['(function () {', '}());']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-wrap');

  grunt.registerTask('templates', ['jst', 'wrap']);
};
