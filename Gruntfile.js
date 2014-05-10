module.exports = function (grunt) {
    'use strict';

    var jslintFiles = [
        'Gruntfile.js',
        'src/ext/*.js',
        'src/ext/init.js.erb',
        'src/config/**/*.js.erb'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jslint: {
            all: {
                src: jslintFiles,
                exclude: [
                    'src/ext/templates.js',
                    'src/ext/kingdom_generator.js'
                ],
                directives: {
                    ass: true,
                    browser: true,
                    devel: true,
                    es5: true,
                    forin: true,
                    indent: 4,
                    maxlen: 116,
                    node: true,
                    nomen: true,
                    regexp: true,
                    stupid: true, // tolerate method name ending in -Sync
                    todo: true,
                    unparam: true,
                    vars: true,
                    globals: [
                        '$',
                        '_',
                        'Audio',
                        'CampaignBattleScreen',
                        'DEFAULT_RATING',
                        'Dom',
                        'DominionClient',
                        'FS',
                        'FormData',
                        'GS',
                        'Goko',
                        'Notification',
                        'VhonTools',
                        'WebSocket',
                        'angular',
                        'mtgRoom'
                    ]
                }
            }
        },

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
        },

        watch: {
            jslint: {
                files: jslintFiles,
                tasks: ['jslint']
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-wrap');

    grunt.registerTask('templates', ['jst:compile', 'wrap:templates']);
};
