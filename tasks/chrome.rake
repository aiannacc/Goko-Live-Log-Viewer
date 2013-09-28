# encoding: UTF-8

namespace :chrome do

    desc 'Assemble content and generate config files for Chrome extension'
    task :build do

        # Prepare a blank Chrome Extension project
        FileUtils.rm_rf 'build/chrome/'
        FileUtils.rm_rf 'build/chrome/gokosalvager.zip'
        FileUtils.mkdir_p 'build/chrome/images'

        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })

        # Build package description
        man_json = fill_template 'src/config/chrome/manifest.json.erb', props
        File.open('build/chrome/manifest.json', 'w') {|f| f.write man_json }

        # Build script loader
        man_json = fill_template 'src/config/chrome/loadAll.js.erb', props
        File.open('build/chrome/loadAll.js', 'w') {|f| f.write man_json }

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/lib/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/chrome/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/chrome/images/'

        # Insert build version and copy init script
        init_json = fill_template 'src/ext/init.js.erb', props
        File.open('build/chrome/init.js', 'w') {|f| f.write init_json }

        puts 'Assembled Chrome extension files. Ready to build or use as an
              unpacked extension.'
    end

    desc 'Create a .zip for Chrome'
    task :zip => ['chrome:build'] do
        FileUtils.rm_rf 'build/gokosalvager.zip'
        Dir.chdir('build/chrome') { sh 'zip -r ../gokosalvager.zip *' }
        puts 'build/gokosalvager.zip created'
    end

    desc 'Create a signed .crx for Chrome'
    task :crx => ['chrome:build'] do
        sh './crxmake.sh build/chrome ~/.private/chrome_key.pem'
        FileUtils.mv 'chrome.crx', 'build/gokosalvager.crx'
        puts 'build/gokosalvager.crx created'
    end

end
