# encoding: UTF-8

require 'rake/clean'

CLEAN.include 'tmp/*'
CLEAN.include 'build/*/'
CLOBBER.include 'build/*'

SCRIPT = 'src/ext/Goko_Live_Log_Viewer.user.js'
PARSER = 'src/dev/set_parser.js'

CREATE_AND_SIGN = 'src/dev/createAndSign.sh'
WRAPPER = 'src/dev/runInPageContext.js'

VERSION = 'VERSION'

CHROME_MANIFEST = 'chrome/manifest.json'
CHROME_IMAGES = 'chrome/images/'

FIREFOX_PACKAGE = 'firefox/package.json'

SAFARI_INFO = 'safari/Info.plist'
SAFARI_SETTINGS = 'safari/Settings.plist'

def get_version
  File.read(VERSION).strip
end

def replace_pattern_in_file(old_pattern, new_string, target)
  text = File.read(target).gsub(/#{old_pattern}/, "#{new_string}")
  File.open(target, 'w') { |f| f.puts text }
end

def insert_set_parser_into_main_script(out_file_name)
  out = File.new(out_file_name, 'w')
  out.write(File.read(PARSER))
  out.write(File.read(SCRIPT))
  out.close
end

def run_in_page_context(file)
  f = File.read(file)
  t = File.new(file, 'w')
  File.open(WRAPPER) do |w|
    w.each_line do |l|
      t.write(l.strip == '// insert file here' ? f : l)
    end
  end
  t.close
end

Dir.glob('tasks/*.rake').each { |r| import r }

# create firefox first, since it creates a temporary.zip, overwriting chrome's .zip
# TODO: create a signed .crx for chrome instead of a .zip
desc 'Build packages for all supported browsers'
task :default => ['build:firefox', 'chrome:build', 'build:safari']
