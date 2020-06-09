default:
	@echo "*** BežiApp Makefile ***"
	@echo "targets:"
	@echo "	make prepare	installs dependencies, cleans after itself, requires sudo permissions and debian/ubuntu for apt"
	@echo "	make install	installs BežiApp to dist/"
	@echo "no target specified, exiting ..."

prepare:
	#!/bin/bash
	sudo apt install git
	mkdir tmp
	cd tmp
	rm -rf bverbose
	git clone https://github.com/sijanec/bverbose
	cd bverbose
	make prepare
	make install
	mv bin ../../bin
	cd ..
	rm -rf bverbose
	cd ..

install:
	#!/bin/bash
	./bin/bvr-compose-html assets/pages-src/ dist/pages/ .html
	cp -r assets/css dist/
	cp -r assets/fonts dist/
	cp -r assets/img dist/
	find assets/root/ -type f \( ! -name "*.bvr" \) -exec cp -r "{}" dist/  \;
	find assets/root/ -name "*.bvr" -printf "%f\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/\${FILE/.bvr/}"; ./bin/bvr-compose-single \"assets/root/\$FILE\" \"\$FILE_DST\""

	# js bvr fajli
	mkdir -p dist/js
	# js ne znam te magije
	find assets/js/ -name "*.bvr" -printf "%f\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/js/\${FILE/.bvr/}"; ./bin/bvr-compose-single \"assets/js/\$FILE\" \"\$FILE_DST\""
	find assets/js/ -name "*.js" -printf "%P\n" | xargs -I % bash -c "FILE='%'; FILE_DST="dist/js/\${FILE/.bvr/}"; ./bin/bvr-jsmin assets/js/\"\$FILE\" \"\$FILE_DST\""

	cp -r assets/root/.well-known dist/

