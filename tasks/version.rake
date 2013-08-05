# encoding: UTF-8

VERSION_BROWSER_INFO = {
  chrome: {
    CHROME_MANIFEST => [->(v) { "\"version\": \"#{v}\"" }]
  },
  firefox: {
    FIREFOX_PACKAGE => [->(v) { "\"version\": \"#{v}\"" }]
  },
  safari: {
    SAFARI_INFO => [
                    ->(v) { "<key>CFBundleShortVersionString</key>\n\t<string>#{v}<\/string>" },
                    ->(v) { "<key>CFBundleVersion</key>\n\t<string>#{v}<\/string>" }
                   ]
  }
}

# register a file dependency for each browser-specific file
# that references the version
VERSION_BROWSER_INFO.each do |browser, info|
  info.each do |file_name, patterns|
    file file_name => VERSION do |t|
      patterns.each { |p| replace_pattern_in_file(p.call('.*'), p.call(get_version), t.name) }
    end
  end
end

# returns a string containing the version found in VERSION incremented by 0.0.1
def increment_version
  version_parts = get_version.split('.').map { |n| n.to_i }
  version_parts[2] += 1
  version_parts.join('.')
end

task :update_version, :new_v do |t, args|
  version = args[:new_v] || increment_version
  File.open(VERSION, 'w') { |f| f.puts version }
end

desc 'Increment the version number by 0.0.1, or set a new version'
task :version, [:new_v] => [:update_version, VERSION_BROWSER_INFO.values.map { |v| v.keys }].flatten
