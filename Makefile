.PHONY: all index.html archive/prerelease/1.1/index.html

all: index.html archive/prerelease/1.1/index.html

latest: index.html

index.html: index.bs
	curl https://api.csswg.org/bikeshed/ -F file=@index.bs -F output=err
	curl https://api.csswg.org/bikeshed/ -F file=@index.bs -F force=1 > index.html | tee

archive/prerelease/1.1/index.html: archive/prerelease/1.1/index.bs
	curl https://api.csswg.org/bikeshed/ -F file=@archive/prerelease/1.1/index.bs -F output=err
	curl https://api.csswg.org/bikeshed/ -F file=@archive/prerelease/1.1/index.bs -F force=1 > archive/prerelease/1.1/index.html | tee
