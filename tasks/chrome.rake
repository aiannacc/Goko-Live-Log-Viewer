# encoding: UTF-8

namespace :chrome do

  directory 'build/chrome/images'

  images = Dir.glob('chrome/images/*.png')
  build_images = images.map { |f| "build/#{f}" }

  # TODO: use the Dir class to do this file name stuff right
  automatch_script_names = Dir.glob('src/ext/automatch*.js').map { |f| f.gsub('src/ext/', '') } << 'gokoHelpers.js'
  automatch_build_scripts = automatch_script_names.map { |f| "build/chrome/#{f}" }

  automatch_script_names.each do |f|
    file "build/chrome/#{f}" => ['build/chrome', "src/ext/#{f}"] do |t|
      FileUtils.cp "src/ext/#{f}", t.name
    end
  end

  build_scripts = automatch_build_scripts << 'build/chrome/Goko_Live_Log_Viewer.user.js'

  file 'build/chrome/Goko_Live_Log_Viewer.user.js' => ['build/chrome', 'src/ext/Goko_Live_Log_Viewer.user.js', 'src/dev/set_parser.js', 'src/dev/runInPageContext.js'] do |t|
    sh "cat src/dev/set_parser.js src/ext/Goko_Live_Log_Viewer.user.js > #{t.name}"
    run_in_page_context(t.name)
  end

  # TODO: make manifest a template so we can insert name/description/version
  #   during build process; for now just copy it
  file 'build/chrome/manifest.json' => ['build/chrome', 'chrome/manifest.json'] do |t|
    FileUtils.cp('chrome/manifest.json', t.name)
  end

  # simply copy the whole dir chrome/images/ to build/chrome/images/
  #
  # generate the list dynamically so we can add images into
  #   chrome/images and it will just work
  images.each do |f|
    file "build/#{f}" => ['build/chrome/images', f] do |t|
      FileUtils.cp f, t.name
    end
  end

  desc 'Use build/chrome/ as an "unpacked extension" for developing on Chrome'
  task dev: ['build/chrome/manifest.json', build_images, build_scripts].flatten do
    puts 'ready to use build/chrome/ as unpacked extension'
  end

  file 'build/gokosalvager.zip' => ['chrome:dev'] do |t|
    FileUtils.rm_rf 'build/gokosalvager.zip'
    sh 'cd build/ && zip -r gokosalvager.zip chrome'
  end

  desc 'Create a .zip for Chrome'
  task build: ['build/gokosalvager.zip'] do
    puts 'build/gokosalvager.zip created'
  end

end
