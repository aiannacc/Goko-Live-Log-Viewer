# encoding: UTF-8

DEV_BROWSER_INFO = {
  chrome: {
    'tmp/manifest.json' => CHROME_MANIFEST,
    'tmp/images/' => CHROME_IMAGES,
    'tmp/automatch.js' => 'src/ext/automatch.js',
    'tmp/automatchGamePop.js' => 'src/ext/automatchGamePop.js',
    'tmp/automatchOfferPop.js' => 'src/ext/automatchOfferPop.js',
    'tmp/automatchSeekPop.js' => 'src/ext/automatchSeekPop.js',
    'tmp/gokoHelpers.js' => 'src/ext/gokoHelpers.js'
  }
}

namespace :dev do
  DEV_BROWSER_INFO.each do |browser, info|
    info.each do |target, src|
      file target => src do
        FileUtils.mkdir_p 'tmp'
        FileUtils.cp_r src, target
      end
    end
  end

  file 'tmp/Goko_Live_Log_Viewer.user.js' => [SCRIPT, PARSER, WRAPPER] do |t|
    insert_set_parser_into_main_script(t.name)
    run_in_page_context(t.name)
  end

  desc 'Use tmp/ as an "unpacked extension" for developing on Chrome (or Opera)'
  task chrome: [DEV_BROWSER_INFO[:chrome].keys, 'tmp/Goko_Live_Log_Viewer.user.js'].flatten do
    puts 'ready to use tmp/ as unpacked extension'
  end
end
