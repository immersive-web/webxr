.PHONY: all spec/latest/index.html spec/1.1/index.html

all: latest 1.1

latest: spec/latest/index.html

1.1: spec/1.1/index.html

spec/latest/index.html: spec/latest/index.bs
	curl https://api.csswg.org/bikeshed/ -F file=@spec/latest/index.bs -F output=err
	curl https://api.csswg.org/bikeshed/ -F file=@spec/latest/index.bs -F force=1 > spec/latest/index.html | tee

spec/1.1/index.html: spec/1.1/index.bs
	curl https://api.csswg.org/bikeshed/ -F file=@spec/1.1/index.bs -F output=err
	curl https://api.csswg.org/bikeshed/ -F file=@spec/1.1/index.bs -F force=1 > spec/1.1/index.html | tee

wip: spec/wip/index.html

spec/wip/index.html: spec/wip/index.bs
	curl https://api.csswg.org/bikeshed/ -F file=@spec/wip/index.bs -F output=err
	curl https://api.csswg.org/bikeshed/ -F file=@spec/wip/index.bs -F force=1 > spec/wip/index.html | tee
