Based on instructions found on
[streak.com](http://developer.streak.com/2013/01/how-to-build-safari-extension-using.html).

To build and install the Safari extension yourself, you will need a Safari
Developer Certificate (which you can only get by enrolling in the
[Safari Developer Program](https://developer.apple.com/programs/safari/)), follow
these instructions, and then run `rake safari:build`.

When your Safari Developer Certificate expires, you will need to follow these
instructions again to get the proper files into your `~/.private/safari`.

# Building Safari Extensions from the command line

1. Install latest version of Safari

2. Download a patched version of the
   [eXtensible ARchiver (xar) utility](https://github.com/downloads/mackyle/xar/xar-1.6.1.tar.gz)

3. [Download this shell script](https://gist.github.com/omarstreak/4561451) and
   run it in the directory you download the xar archive in. The first argument
   to the script is the directory you want to install the xar bin to (for
   example "~/patched-xar"; you'll use this directory in step 7).

4. Register with
   [Apple's developer program](https://developer.apple.com/programs/safari/)

5. Create and download your Safari Extension Certificate

6. Create and sign your Safari extension manually with the built-in Safari
   Extension builder
     * Enable the Developer menu `Safari > Preferences... > Advanced > Show Developer menu in the menu bar`
     * `Develop > Show Extension Builder`
     * click the `+` button in the lower left, then `New extension...`
     * save the new extension wherever you like (for example, on the Desktop as
       "new.safariextz")

7. In the command line type (substituting directory and filenames as
   appropriate; this example uses the example names given in the previous
   steps):

    ```bash
    mkdir ~/.private/safari
    cd ~/Desktop
    ~/patched-xar/xar -f new.safariextz --extract-certs ~/.private/safari
    ```

8. Go to Keychain Access and right-click on your certificate and choose Export.

9. Export your certificate in p12 format (save as "Certificates.p12" on the
   Desktop), just put in blank when it asks for the password

10. In the command line, input these commands:

    ```bash
    cd ~/Desktop
    openssl pkcs12 -in Certificates.p12 -nodes | openssl x509 -outform der -out cert.der
    openssl pkcs12 -in Certificates.p12 -nodes | openssl rsa -out key.pem
    cp cert.der key.pem ~/.private/safari
    cd ~/.private/safari
    openssl dgst -sign key.pem -binary < key.pem | wc -c > size.txt
    ```

11. Your `~/.private/safari` should now have the following files:
    * cert.der
    * cert01
    * cert02
    * key.pem
    * size.txt

12. `rake safari:build` will create `build/safari/gokosalvager.safariextension/`
    and `build/gokosalvager.safariextz`. Inspect the files in
    `build/safari/gokosalvager.safariextension/` to see exactly how the source
    is translated into files Safari can use, and double-click on
    `build/gokosalvager.safariextz` from the Finder to add it to Safari.

# Updating your Safari Developer Certificate

1. Log on to the Apple Developer Center, and go to the
   [Account page](https://developer.apple.com/account/overview.action).

2. Click on "Certificates" under "Safari Extensions".

3. Click `+` to create a new Certificate Signing Request.

4. Follow the instructions to create a `.certSigningRequest` file with the Keychain
   Access application, and click "Continue".

5. Upload your generated `.certSigningRequest` file, then click "Generate".

6. Downlaod the generated Certificate, then follow the steps in the previous
   section for generating the appropriate files in your `~/.private/safari`
