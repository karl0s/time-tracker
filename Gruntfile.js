'use strict';

module.exports = function(grunt){
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
       pkg: grunt.file.readJSON('package.json'),
        develop: {
            server: {
                file: 'bin/www',
                env: { NODE_ENV: 'development' }
            }
        },
        watch: {
            options: {
                nospawn: true,
                livereload: true
            },
            public: {
                files: 'public/**/*.*'
            },
            views: {
                files: 'views/**/*.jade'
            }
        }
    });

    grunt.registerTask('default', ['develop', 'watch']);
};