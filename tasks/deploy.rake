# encoding: UTF-8

desc 'Build all three extensions and deploy them to the extension server'
task :deploy => ['firefox:build', 'chrome:crx', 'safari:build'] do

    FileUtils.mkdir_p 'build/update/'

    # Read properties from common config file
    props = eval(File.open('config.rb') {|f| f.read })

    # Build Firefox update .rdf
    up_firefox = fill_template 'update/update_firefox.rdf.erb', props
    File.open('build/update/update_firefox.rdf', 'w') {|f| f.write up_firefox }
    
    # TODO: Build firefox updateinfo file (?)

    # Build Chrome update .xml
    up_chrome = fill_template 'update/update_chrome.xml.erb', props
    File.open('build/update/update_chrome.xml', 'w') {|f| f.write up_chrome }

    # Build Safari update .plist
    up_safari = fill_template 'update/update_safari.plist.erb', props
    File.open('build/update/update_safari.plist', 'w') {|f| f.write up_safari }

    # Copy update files to server
    sh 'scp build/update/update* ' + props[:hostServer] + ':' + props[:hostDir]

    # Copy extension files to server
    scpDir = props[:hostDir] + 'v' + props[:version] + '/'
    sh 'ssh ' + props[:hostServer] + ' "rm -rf ' + scpDir + '"'
    sh 'ssh ' + props[:hostServer] + ' "mkdir -p ' + scpDir + '"'
    #sh 'scp update/index.html ' + props[:hostServer] + ':' + scpDir
    sh 'scp build/gokosalvager.xpi ' + props[:hostServer] + ':' + scpDir
    sh 'scp build/gokosalvager.crx ' + props[:hostServer] + ':' + scpDir
    sh 'scp build/gokosalvager.safariextz ' + props[:hostServer] + ':' + scpDir
    cmd = 'cd ' + props[:hostDir] + ' && '\
        + 'rm -f safari-latest-gokosalvager.safariextz && '\
        + 'ln -s v' + props[:version] + '/gokosalvager.safariextz safari-latest-gokosalvager.safariextz'
    sh 'ssh ' + props[:hostServer] + ' "' + cmd + '"'
    sh 'scp indexdirs.sh ' + props[:hostServer] + ':' + props[:hostDir]
    cmd = 'cd ' + props[:hostDir] + " && find -type d | xargs -I {} -d '\\n' ./indexdirs.sh {}"
    sh 'ssh ' + props[:hostServer] + ' "' + cmd + '"'
    #scp build/gokosalvager.safariextz ' + props[:hostServer] + ':' + \
    #    props[:hostDir] + 'safari-latest-gokosalvager.safariextz'
end
