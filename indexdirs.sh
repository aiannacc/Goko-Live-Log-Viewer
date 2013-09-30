#!/usr/bin/bash

dir="$1"


cd "$dir"
#echo $dir

rm -f index.html
touch index.html

echo '<a href="../index.html">Up</a><br>' >> index.html
find -maxdepth 1 -iname '[^.]*' -type d | sort | perl -pe 's|\./(.*)|<a href="$1/index.html">$1</a><br>|' >> index.html
#echo
find -maxdepth 1 -type f \! -iname "index.html" | sort | perl -pe 's|\./(.*)|<a href="$1">$1</a><br>|' >> index.html
#echo

cd - > /dev/null
