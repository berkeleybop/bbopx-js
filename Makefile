####
#### Testing, benchmarking, and release procedures for BBOPX-JS.
####
#### See README.org in this directory for more detail.
####
#### A report-mistakes-only testing ("fail"s?) run can be done as:
####  make test | grep -c -i fail; test $? -ne 0
####

BBOP_JS ?= ../bbop-js/

TESTS = \
 $(wildcard lib/bbopx/noctua/*.js.tests) \
 $(wildcard lib/bbopx/barista/*.js.tests) \
 $(wildcard lib/bbopx/minerva/*.js.tests)
# $(wildcard lib/bbopx/rest/response/*.js.tests)

## Test JS environment.
TEST_JS = rhino
## Some tests require things like "-opt -1" in some cases (big GO tests).
## rhino needs this for the big GO tree in model.tests.go.js.
## Java BUG, so interpretation is forced.
## See: http://coachwei.sys-con.com/node/676073/mobile
#TEST_JS_FLAGS = -modules staging/bbopx.js -opt -1 -w -strict
TEST_JS_FLAGS = -modules external/bbop.js -modules staging/bbopx.js -opt -1

## Other JS environments.
NODE_JS ?= /usr/bin/node
#NODE_JS ?= /home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
RHINO_JS ?= /usr/bin/rhino
RINGO_JS ?= /usr/bin/ringo

## Handle versioning. The patch level is automatically incremented on
## after every release.
# This is always alpha software--peg at 0.9 forever.
BBOPX_JS_BASE_VERSION = 0.9
BBOPX_JS_PATCH_LEVEL = `cat version-patch.lvl`
BBOPX_JS_VERSION_TAG = "" # e.g. -alpha
BBOPX_JS_VERSION ?= $(BBOPX_JS_BASE_VERSION).$(BBOPX_JS_PATCH_LEVEL)$(BBOPX_JS_VERSION_TAG)

all:
	@echo "Using JS engine: $(TEST_JS)"
#	@echo "All JS engines: $(JSENGINES)"
	@echo "Tests defined: $(TESTS)"
	@echo "See README.org in the directory for more details."
#	@echo "Benchmarks defined: $(BENCHMARKS)"

###
### Tests.
###

.PHONY: test $(TESTS)
test: $(TESTS)
$(TESTS): bundle
	echo "trying: $@"
	$(TEST_JS) $(TEST_JS_FLAGS) -f $(@D)/$(@F)
#	cd $(@D) && $(TEST_JS) $(TEST_JS_FLAGS) -f $(@F)

###
### Just the exit code results of the tests.
###

.PHONY: pass
pass:
	make test | grep -i fail; test $$? -ne 0

###
### Documentation.
###

.PHONY: docs

docs:
	naturaldocs --rebuild-output --input lib/bbopx/ --project docs/.naturaldocs_project/ --output html docs/
#	naturaldocs --rebuild-output --input lib/bbopx/ --input bin/ --project docs/.naturaldocs_project/ --output html docs/

###
### Create exportable JS bundle.
###

.PHONY: update-external
update-external:
	@echo "Using BBOP-JS at: $(BBOP_JS)"
	cd $(BBOP_JS); make bundle
	cp $(BBOP_JS)/staging/bbop.js ./external

.PHONY: bundle
bundle: update-external
	./scripts/release-js.pl -v -i scripts/release-file-map.txt -o staging/bbopx.js -n bbopx -d lib/bbopx -r $(BBOPX_JS_VERSION)

###
### Create exportable JS bundle, but skip minifying.
###

.PHONY: bundle-uncompressed
bundle-uncompressed: update-external
	./scripts/release-js.pl -v -u -i scripts/release-file-map.txt -o staging/bbopx.js -n bbopx -d lib/bbopx -r $(BBOPX_JS_VERSION)

###
### Build version control.
###

.PHONY: version
version:
	@echo Current version: $(BBOPX_JS_VERSION)

.PHONY: patch-reset
patch-reset:
	echo 0 > version-patch.lvl

.PHONY: patch-incr
patch-incr:
	echo $$(( $(BBOPX_JS_PATCH_LEVEL) + 1 )) > version-patch.lvl

###
### Create exportable JS NPM directory.
###

## Steps forward the patch level after every release--this is required
## to really use npm.
.PHONY: npm
npm: bundle
	./scripts/release-npm.pl -v -i staging/bbopx.js -o npm/bbopx -r $(BBOPX_JS_VERSION)
	npm publish npm/bbopx
	make patch-incr

###
### Release: docs and bundle.
###

.PHONY: release
release: bundle npm docs
#	s3cmd -P put staging/bbopx*.js s3://bbopx/jsapi/
#	s3cmd -P put demo/index.html s3://bbopx/jsapi/bbopx-js/demo/
#	s3cmd -P put demo/golr.js s3://bbopx/jsapi/bbopx-js/demo/
#	s3cmd --recursive -P put docs/ s3://bbopx/jsapi/bbopx-js/docs/
