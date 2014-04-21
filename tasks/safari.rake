# encoding: UTF-8

# Based on http://blog.streak.com/2013/01/how-to-build--extension.html.
# Contains instructions on obtaining your Safari developer security files.
def create_and_sign(src_dir, cert_dir, target)

    # Required Apple Safari developer security files:
    # - cert.der, cert01, cert02, key.pem, size.txt
    cert_dir = File.expand_path('~/.private/safari')
    size_file = File.join(cert_dir, 'size.txt')

    # Create the extension archive file
    sh "xar -czf #{target} --distribution #{src_dir}"

    # Generate and sign archive digest
    sh "xar --sign -f #{target}" \
        + " --digestinfo-to-sign digest.dat" \
        + " --sig-size #{File.read(size_file).strip}" \
        + " --cert-loc #{cert_dir}/cert.der" \
        + " --cert-loc #{cert_dir}/cert01" \
        + " --cert-loc #{cert_dir}/cert02"

    # Generate and inject signature file
    sh "openssl rsautl -sign -inkey #{cert_dir}/key.pem \
                -in digest.dat -out sig.dat"
    sh "xar --inject-sig sig.dat -f #{target}"

    # Clean up
    rm_f ['sig.dat', 'digest.dat']
    FileUtils.chmod 0744, target
end

namespace :safari do

    build_dir = 'build/safari/gokosalvager.safariextension/'

    # Assemble content and generate config files for Safari Add-on
    task :assemble, :update_url, :source_url, :title do |task, args|

        # Prepare an empty directory to assemble the Safari extension in
        FileUtils.rm_rf 'build/safari/'
        FileUtils.rm_rf 'build/gokosalvager.safariextz'
        FileUtils.mkdir_p build_dir

        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })
        props[:update_url] = args[:update_url]
        props[:source_url] = args[:source_url]
        props[:title] = args[:title]

        # Build info and settings files
        info_plist = fill_template 'src/config/safari/Info.plist.erb', props
        File.open(build_dir + 'Info.plist', 'w') {|f| f.write info_plist }
        FileUtils.cp_r 'src/config/safari/Settings.plist', build_dir

        # prepare templates.js
        sh 'grunt templates'

        # Copy js, css, and png content
        # TODO: How to specify the Safari extension icon?
        FileUtils.cp_r Dir.glob('src/ext/*.js'), build_dir
        FileUtils.cp_r Dir.glob('src/ext/*.css'), build_dir
        FileUtils.cp Dir.glob('src/img/*.png'), build_dir

        # Insert build version and copy init script
        init_json = fill_template 'src/ext/init.js.erb', props
        File.open(build_dir + 'init.js', 'w') {|f| f.write init_json }

        # Wrap JS scripts to be run in Goko's gameClient.html context
        Dir.glob(build_dir + '*.js').each do |js_script|
            run_in_page_context(js_script)
        end

        puts 'Assembled Safari Extension files.'
    end

    task :signed, :update_url, :source_url do |task, args|
        Rake::Task['safari:assemble'].invoke(args[:update_url], args[:source_url])

        Dir.chdir('build/safari') {
            create_and_sign 'gokosalvager.safariextension',
                            '~/.safari-certs',
                            'gokosalvager.safariextz'
        }
        FileUtils.mv 'build/safari/gokosalvager.safariextz', 'build/'
    end

    desc 'Create a signed .extz for Safari.'
    task :build, :forbetas do |task, args|
        props = eval(File.open('config.rb') {|f| f.read })
        server = 'https://%s' % [props[:hostServer]]
        if args[:forbetas] == 'true' then
            upfile = 'update_safari_forbetas.plist'
            sofile = 'v%s/forbetas/gokosalvager.safariextz' % [props[:version]]
            title = "%s (beta tester version)" % props[:title]
        else
            upfile = 'update_safari.plist'
            sofile = 'v%s/gokosalvager.safariextz' % [props[:version]]
            title = "%s" % props[:title]
        end
        update_url= '%s%s%s' % [server, props[:hostURLBase], upfile]
        source_url = '%s/%s' % [server, sofile]
        puts update_url

        Rake::Task['safari:signed'].invoke(update_url, source_url, title)
        puts 'Built Safari .safariextz file'
        puts
    end
end
