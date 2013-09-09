# encoding: UTF-8

namespace :firefox do

    desc 'Assemble content and generate config files for Firefox Add-on'
    task :dev do

        # Prepare a blank Firefox Add-on project
        FileUtils.rm_rf 'build/firefox/'
        FileUtils.rm_rf 'build/firefox/gokosalvager.xpi'
        FileUtils.mkdir_p 'build/firefox/chrome/icons/default'

        # Copy config files
        # TODO: generate these dynamically again
        FileUtils.cp_r Dir.glob('src/config/firefox/*'), 'build/firefox/'

        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })

        # Build main loader script dynamically
        main_js = fill_template 'src/config/firefox/content/main.js.erb', props
        File.open('build/firefox/content/main.js', 'w') {|f| f.write main_js }
        FileUtils.rm 'build/firefox/content/main.js.erb'

        # Build info file dynamically
        inst_rdf = fill_template 'src/config/firefox/install.rdf.erb', props
        File.open('build/firefox/install.rdf', 'w') {|f| f.write inst_rdf }
        FileUtils.rm 'build/firefox/install.rdf.erb'

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/lib/*.js'), 'build/firefox/content/'
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/content/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/firefox/content/'
        FileUtils.mkdir_p 'build/firefox/icons/default'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/firefox/icons/default/'

        puts 'Firefox Add-On is ready to test/build'
    end

    desc 'Test the Firefox extension'
    # Note: ~/.mozilla/firefox/test should link to your testing profile dir
    task :test => [:dev] do
        sh 'cfx -v run --pkgdir=build/firefox/ --binary-args \
            "-url https://play.goko.com/Dominion/gameClient.html" \
            --profiledir ~/.mozilla/firefox/test'
    end

    desc 'Create the Firefox extension .xpi'
    task :build => [:dev] do
        Dir.chdir('build/firefox') { sh 'zip ../gokosalvager.xpi -r *' }
    end
end
