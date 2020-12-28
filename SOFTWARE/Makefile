.PHONY : build upload clean bump_patch bump_minor bump_major

build:
	python setup.py sdist

upload:
	twine upload dist/*

clean:
	rm -rf build
	rm -rf dist
	rm -rf colosseum_ui.egg-info
	rm -rf docs/_build
	rm -rf docs/api
	rm -rf .coverage

bump_patch:
	bumpversion patch

bump_minor:
	bumpversion minor

bump_major:
	bumpversion major
