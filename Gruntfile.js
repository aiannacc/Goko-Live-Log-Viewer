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

        qunit: {
            all: ['test/**/*.html']
        },

        shell: {
            chrome_assemble: {
                command: 'rake chrome:assemble'
            },
            firefox_build: {
                command: 'rake firefox:build'
            },
            safari_build: {
                command: 'rake safari:build'
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
            },
            chrome: {
                files: [
                    'Gruntfile.js',
                    'Rakefile',
                    'config.rb',
                    'crxmake.sh',
                    'src/config/chrome/**/*',
                    'src/ext/**/*',
                    'src/img/**/*',
                    'src/lib/**/*',
                    'src/templates/**/*'
                ],
                tasks: ['shell:chrome_assemble']
            },
            firefox: {
                files: [
                    'Gruntfile.js',
                    'Rakefile',
                    'config.rb',
                    'src/config/firefox/**/*',
                    'src/ext/**/*',
                    'src/img/**/*',
                    'src/lib/**/*',
                    'src/templates/**/*'
                ],
                tasks: ['shell:firefox_build']
            },
            safari: {
                files: [
                    'Gruntfile.js',
                    'Rakefile',
                    'config.rb',
                    'src/config/safari/**/*',
                    'src/dev/runInPageContext.js',
                    'src/ext/**/*',
                    'src/img/**/*',
                    'src/lib/**/*',
                    'src/templates/**/*'
                ],
                tasks: ['shell:safari_build']
            },
            browsers: {
                files: [
                    'Gruntfile.js',
                    'Rakefile',
                    'config.rb',
                    'crxmake.sh',
                    'src/config/**/*',
                    'src/dev/runInPageContext.js',
                    'src/ext/**/*',
                    'src/img/**/*',
                    'src/lib/**/*',
                    'src/templates/**/*'
                ],
                tasks: [
                    'shell:chrome_assemble',
                    'shell:firefox_build',
                    'shell:safari_build'
                ]
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-wrap');

    grunt.registerTask('templates', ['jst:compile', 'wrap:templates']);
    grunt.registerTask('test', ['qunit:all']);
};
