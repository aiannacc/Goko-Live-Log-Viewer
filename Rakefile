# encoding: UTF-8

require 'rake/clean'
require 'erb'
require 'ostruct'

CLEAN.include 'build/*/'
CLOBBER.include 'build'

PARSER = 'src/dev/set_parser.js'

# TODO: Restore this. I didn't understand it before, but it's better than
#       manually merging set_parser.js and kingdom_builder.js as I'm doing now.
def insert_set_parser_into_main_script(out_file_name)
  out = File.new(out_file_name, 'w')
  out.write(File.read(PARSER))
  out.write(File.read(SCRIPT))
  out.close
end

WRAPPER = 'src/dev/runInPageContext.js'

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


def fill_template(templatefile, property_hash)
    config = property_hash
    template = File.read(templatefile)
    return ERB.new(template).result(binding)
end

Dir.glob('tasks/*.rake').each { |r| import r }

# TODO: create a signed .crx for chrome instead of a .zip
desc 'Build packages for all supported browsers'
task :default => ['firefox:build', 'chrome:build', 'safari:build']
