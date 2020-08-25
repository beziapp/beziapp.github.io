default:
	@echo "*** BežiApp Makefile ***"
	@echo "targets:"
	@echo "	make prepare	installs dependencies, uses \`sudo apt\`."
	@echo "	make generate	installs BežiApp to dist/"
	@echo "notes and hacks:"
	@echo "	\`cp /bin/cp bin/bvr-jsmin\`	if you don't want jsmin (before generate)"
	@echo "no target specified, exiting ..."

prepare:
	#!/bin/bash
	sudo apt install git -y
	mkdir -p tmp
	rm -rf tmp/bverbose
	cd tmp && git clone https://github.com/sijanec/bverbose && cd bverbose && \
	make prepare &&	make install
	mv tmp/bverbose/bin/* bin/
	rm -rf tmp/bverbose

generate:
	#!/bin/bash
	./bin/bvr-compose-html assets/pages-src/ dist/pages/ .html
	cp -r assets/css dist/
	cp -r assets/fonts dist/
	cp -r assets/img dist/
	find assets/root/ -type f \( ! -name "*.bvr" \) -exec cp -r "{}" dist/  \;
	-find assets/root/ -name "*.bvr" -printf "%f\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/\$${FILE/.bvr/}"; ./bin/bvr-compose-single \"assets/root/\$$FILE\" \"\$$FILE_DST\""
	# js bvr fajli
	mkdir -p dist/js
	# js ne znam te magije
	-find assets/js/ -name "*.bvr" -printf "%f\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/js/\$${FILE/.bvr/}"; ./bin/bvr-compose-single \"assets/js/\$$FILE\" \"\$$FILE_DST\""
	-find assets/js/ -name "*.js" -printf "%P\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/js/\$${FILE/.bvr/}"; ./bin/bvr-jsmin assets/js/\"\$$FILE\" \"\$$FILE_DST\""
	cp -r assets/root/.well-known dist/
	chmod 0775 dist -R
