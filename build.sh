mkdir -p dist/js \
&& mkdir -p dist/css \
&& mkdir -p dist/icon \
\
&& cp src/manifest.json  dist/ \
&& cp src/js/*.js        dist/js/ \
&& cp icon/*.png         dist/icon/ \
\
&& cp bower_components/jquery/dist/jquery.js dist/js/ \
\
&& vulcanize src/popup.html   --inline-script --inline-css | crisper --html dist/popup.html   --js dist/popup.js \
&& vulcanize src/options.html --inline-script --inline-css | crisper --html dist/options.html --js dist/options.js \
\
&& cd dist/ && zip -r redmine-time-tracker.zip *
