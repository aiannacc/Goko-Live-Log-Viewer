# encoding: UTF-8

namespace :chrome do

    # Run as 'rake chrome:build' or 'rake chrome:build[true]'
    desc 'Assemble content and generate config files for Chrome extension'
    task :build, :forbetas do |task, args|
        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })

        # Create update URL
        server = 'https://%s' % [props[:hostServer]]
        if args[:forbetas] == 'true' then
            file = 'update_chrome_forbetas.xml'
            title = "%s (beta tester version)" % props[:title]
        else
            file = 'update_chrome.xml'
            title = "%s" % props[:title]
        end
        update_url = '%s%s%s' % [server, props[:hostURLBase], file]

        Rake::Task['chrome:zip'].invoke(title)
        Rake::Task['chrome:crx'].invoke(update_url, title)
    end

    task :assemble, :update_url, :title do |task, args|
        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })

        # Add a Chrome manifest update_url tag if url given as argument
        if args[:update_url] then
            props[:chrome_update_tag] = '"update_url": "%s",' % [args[:update_url]]
        else
            props[:chrome_update_tag] = ''
        end
        props[:title] = args[:title]

        # Prepare a blank Chrome Extension project
        FileUtils.rm_rf 'build/chrome/'
        FileUtils.rm_rf 'build/chrome/gokosalvager.zip'
        FileUtils.mkdir_p 'build/chrome/images'

        # Build package description
        man_json = fill_template 'src/config/chrome/manifest.json.erb', props
        File.open('build/chrome/manifest.json', 'w') {|f| f.write man_json }

        # Build script loader
        man_json = fill_template 'src/config/chrome/loadAll.js.erb', props
        File.open('build/chrome/loadAll.js', 'w') {|f| f.write man_json }

        # prepare templates.js
        sh 'grunt templates'

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/lib/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/chrome/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/chrome/images/'

        # Insert build version and copy init script
        init_json = fill_template 'src/ext/init.js.erb', props
        File.open('build/chrome/init.js', 'w') {|f| f.write init_json }

        puts 'Assembled Chrome extension files. Ready to use as ' +
             '"unpacked extension."'
    end

    # Create a store-deployable (not self-updating) .zip for Chrome
    task :zip, :title do  |task, args|
        Rake::Task["chrome:assemble"].invoke(nil, args[:title])
        FileUtils.rm_rf 'build/gokosalvager.zip'
        Dir.chdir('build/chrome') { sh 'zip -qr ../gokosalvager.zip *' }
        puts 'Created .zip, for deploying in Chrome Store.'
        puts
    end

    # Create a self-updating .crx for Chrome
    task :crx, :update_url, :title do |task, args|
        Rake::Task['chrome:assemble'].reenable
        Rake::Task['chrome:assemble'].invoke(args[:update_url], args[:title])
        sh './crxmake.sh build/chrome ~/.private/chrome_key.pem'
        FileUtils.mv 'chrome.crx', 'build/gokosalvager.crx'
        puts 'Created signed .crx, for manual installation.'
        puts
    end
end
