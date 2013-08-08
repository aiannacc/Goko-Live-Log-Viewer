# encoding: UTF-8

# TODO - set up the builds with proper dependencies
namespace :build do

  desc 'Create a .xpi for Firefox'
  task :firefox do
    FileUtils.mkdir_p 'build/'
    FileUtils.cp_r 'firefox/', 'build/firefox/'
    FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/data/'

    insert_set_parser_into_main_script('build/firefox/data/logviewer.js')
    run_in_page_context('build/firefox/data/logviewer.js')

    FileUtils.rm 'build/firefox/data/Goko_Live_Log_Viewer.user.js'

    sh 'cd build/ && cfx xpi --pkgdir=firefox/'
    puts 'build/gokosalvager.xpi created'
  end

  desc 'Create a signed .safariextz for Safari'
  task :safari do
    FileUtils.mkdir_p 'build'
    FileUtils.mkdir_p 'gokosalvager.safariextension'
    FileUtils.cp_r Dir.glob('src/ext/*.js'), 'gokosalvager.safariextension/'

    insert_set_parser_into_main_script('gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js')
    run_in_page_context('gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js')

    FileUtils.cp [SAFARI_INFO, SAFARI_SETTINGS],  'gokosalvager.safariextension/'
    sh CREATE_AND_SIGN
    FileUtils.mv ['gokosalvager.safariextz', 'gokosalvager.safariextension'], 'build/'
    puts 'build/gokosalvager.safariextz created'
  end
end
