# encoding: UTF-8

# *** Description ***
#
# The deploy task has been customized to facilitate beta testing.  The goal is
# for beta testers to receive automatic updates (both to betas and official
# releases) just as normal users do.
# 
# To accomplish this, we maintain two separate release tracks, one for
# regular users and another for beta testers.  Regular users should receive
# only official releases, while beta testers should receive both beta and
# official releases.
#
# For example: if the release cycle is [v2.4, v2.5beta, v2.5]
# - regular users should receive [v2.4, v2.5]
# - beta testers should receive [v2.4, v2.5beta, v2.5].
#
# This requires two sets of auto-update files.  For example:
# - update_chrome.xml
# - update_chrome_beta.xml
# This allows us to release to beta testers only by updating only the
# update_chrome_beta.xml file and leaving update_chrome.xml alone.
#
# It also requires two sets of extension files, as the auto-update link
# needs to be different for beta users.  Official releases are therefore
# rebuilt for beta users with this one tweak and deployed to a subdirectory.

# *** Usage ***
#
# Usage 1: rake deploy_official
# Usage 2: rake deploy_beta
#
# Both usages of this task will build and upload the extension files.
# - Usage 1 (for official releases) will update the "latest" links and auto-
#   update files for normal users
# - Usage 2 (for beta releases) will update these for beta testers
#
# Example usage:
# - Make changes, update version numer to '2.5beta'
# - Run 'rake deploy_beta'
# - Fix beta bugs, update version number to '2.5'
# - Run 'rake deploy_official'
# - Run 'rake deploy_beta'

# Read version number and server info
props = eval(File.open('config.rb') {|f| f.read })

# Extension and auto-update info file types
type = {"firefox" => {:ext => "xpi",
                      :update => "rdf"},
        "chrome"  => {:ext => "crx",
                      :update => "xml"},
        "safari"  => {:ext => "safariextz",
                      :update => "plist"}}

desc 'Deploy official release -- for all users'
task :deploy_official do |task,args|
    puts '*** Deploying official release ***'
    Rake::Task[:build].invoke()
    Rake::Task[:upload_build].invoke()
    Rake::Task[:create_latest_version_links].invoke()
    Rake::Task[:create_update_links].invoke()
    Rake::Task[:update_indices].invoke()
end

desc 'Deploy beta release -- for beta testers only'
task :deploy_beta do |task,args|
    puts '*** Deploying beta release ***'
    Rake::Task[:build].invoke('true')
    Rake::Task[:upload_build].invoke('true')
    Rake::Task[:create_latest_version_links].invoke('true')
    Rake::Task[:create_update_links].invoke('true')
    Rake::Task[:update_indices].invoke()
end

# Upload packaged extension files to deployment server
task :upload_build, :beta do |task, args|
    puts "* Creating empty version directory on server"

    # Upload either to the main directory or the 'forbetas' subfolder
    if args[:beta] then
        scpDir = '%s/v%s/forbetas/' % [props[:hostDir], props[:version]]
    else
        scpDir = '%s/v%s/' % [props[:hostDir], props[:version]]
    end

    cmd = '[ -d "%s" ] || mkdir -p %s' % [scpDir, scpDir]
    sh 'ssh %s "%s"' % [props[:hostServer], cmd]
    puts
    puts "* Copying extension files to server"
    type.each do |b,t|
        sh 'scp -q build/gokosalvager.%s %s:%s' % [t[:ext], props[:hostServer], scpDir]
    end
end

# Update directory index files on server
task :update_indices do
    puts
    puts "* Updating directory index files on server"
    sh 'scp -q indexdirs.sh %s:%s' % [props[:hostServer], props[:hostDir]]
    cmd = "cd %s && find -type d | xargs -I {} -d '\\n' ./indexdirs.sh {}" % [props[:hostDir]]
    sh 'ssh %s "%s"' % [props[:hostServer], cmd]
end

# Update permalinks to point to new release
task :create_latest_version_links, :beta do |task,args|

    puts
    puts "* Creating symbolic links to latest versions on server"
    type.each do |b, t|

        # Name of symbolic link file (e.g. chrome-latest-gokosalvager.crx
        #                               or chrome-latest-gokosalvager-beta.crx)
        # Refer to the package file either in the 'v2.4' directory or in its
        # 'forbetas' subdirectory
        if args[:beta] == "true" then
            latest = '%s-latest-gokosalvager-forbetas.%s' % [b, t[:ext]]
            dir = "v%s/forbetas" % [props[:version]]
        else
            latest = '%s-latest-gokosalvager.%s' % [b, t[:ext]]
            dir = "v%s" % [props[:version]]
        end

        # Create symbolic link
        cmd = 'cd ' + props[:hostDir]
        cmd += ' && rm -f %s' % [latest]
        cmd += ' && ln -s %s/gokosalvager.%s %s' % [dir, t[:ext], latest] 
        sh 'ssh %s "%s"' % [props[:hostServer], cmd]
    end
end

# Create and upload info files for auto-updates
task :create_update_links, :beta do |task,args|
    FileUtils.mkdir_p 'build/update/'

    puts
    puts '* Creating auto-update files on server'

    # Create update manifest files pointing to new release
    type.each do |b, t|

        # Name of update file (e.g. update_chrome.xml or update_chrome_beta.xml)
        fname_in = 'update_%s.%s' % [b, t[:update]]
        if args[:beta] == "true" then
            fname_out = 'update_%s_forbetas.%s' % [b, t[:update]]
        else
            fname_out = 'update_%s.%s' % [b, t[:update]]
        end

        # Update target
        updom = 'https://%s:%s' % [props[:hostServer], props[:hostPort]]
        if args[:beta] == "true" then
            upfile = 'v%s/forbetas/gokosalvager.%s' % [props[:version], t[:ext]]
        else
            upfile = 'v%s/gokosalvager.%s' % [props[:version], t[:ext]]
        end
        props[:update_url] = '%s/%s' % [updom, upfile]

        # Populate update file with version info and new version address
        upfile = fill_template 'update/%s.erb' % [fname_in], props
        File.open('build/update/%s' % [fname_out], 'w') {|f| f.write upfile }

        # Copy update file to deploy server
        sh 'scp -q build/update/%s %s:%s' %
           [fname_out, props[:hostServer], props[:hostDir]]
    end
end
