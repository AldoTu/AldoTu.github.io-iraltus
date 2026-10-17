.PHONY: serve

serve:
	export PATH=/opt/homebrew/opt/ruby@3.4/bin:$$PATH && bundle exec jekyll serve
