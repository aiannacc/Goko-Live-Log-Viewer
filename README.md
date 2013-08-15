Goko Dominion Salvager
======================

Discuss the extension at the [Dominion Strategy forum](http://goo.gl/4muRB).


Installation
------------
- Chrome - [get it from the Chrome web store](http://goo.gl/Y9AK5)
- Firefox - [Firefox Add-on Store](https://addons.mozilla.org/en-US/firefox/addon/goko-salvager/)
- Opera - the extension is not currently available in the Opera store, but it may be added by downloading and unzipping the [project ZIP](https://github.com/michaeljb/Goko-Live-Log-Viewer/archive/master.zip) and following [these instructions](http://dev.opera.com/extension-docs/tut_basics.html#step_4_testing_your_extension)
- Safari - [download the extension file](http://goo.gl/1SJmbB), and double-click on it to add it to Safari

Contributing
------------
If you'd like to contribute, either fork this project and submit your changes via pull request, or ask [aiannacc](https://github.com/aiannacc) to make you a collaborator. [This](https://github.com/aiannacc/Goko-Salvager) is the project's central repository.

If you become a collaborator, please follow the [Feature Branch
Workflow](https://www.atlassian.com/git/workflows#!workflow-feature-branch) model. In brief:

1. Create a new branch from master
2. Make and test your changes locally
3. Create a pull request that merges your branch into master
4. Ask a collaborator to verify your changes and handle the pull request

We have rake tasks for building and testing the extension. Running `rake firefox:build` will generate the firefox .xpi file, and there are similar tasks for Chrome and Safari. They all require Ruby (for rake) and a \*nix environment, but you'll also need the [Firefox Add-On SDK](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/) to build for Firefox. Building for Safari is a little more involved. See `tasks/safari.rake` and the blog it links to for more information.

Contributors
------------
- philosophyguy
- nutki
- 1wheel
- michaeljb
- ragingduckd
- yed (Zdenek Bouska)

Development Notes
-----------------
The current "safari:build" rake task doesn't quite work for me (aiannacc), though it does work for michaeljb. For me it generates the correct content but it doesn't sign it correctly. If you face the same problem, you can create a working Safari extension by opening Safari, enabling the Develop menu in Preferences, opening Menu/Develop/Extension Builder, adding the extension files using the bottom-left "+" sign, and then clicking "Build Package." You will need to have your Safari Developer certificate installed for this to work.


