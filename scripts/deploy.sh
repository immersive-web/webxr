#!/usr/bin/env bash

# Adapted from the following scripts:
# - https://github.com/mikeal/dropub/blob/master/scripts/deploy.sh
# - https://gist.github.com/domenic/ec8b0fc8ab45f39403dd
# - http://www.steveklabnik.com/automatically_update_github_pages_with_travis_example/

set -o errexit -o nounset

TRAVIS_PULL_REQUEST=${TRAVIS_PULL_REQUEST:="false"}
TRAVIS_BRANCH=${TRAVIS_BRANCH:="master"}

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "✗ Skipping deploy (because this is a pull request)"
  exit 1
fi

if [ "$TRAVIS_BRANCH" != "master" ]; then
  echo "✗ Skipping deploy (because this is not the `master` branch)"
  exit 1
fi

git fetch origin master:remotes/origin/master

git checkout -f origin/master

MASTER_REV=$(git rev-parse --short HEAD)

npm run build

git init
git config user.name "W3C WebVR Build Bot"
git config user.email "public-webvr@w3.org"

git add -A .
git commit -m "Auto-build of `${MASTER_REV}` (`master`)"
git push -f "https://${GH_TOKEN}@${GH_REF}" HEAD:gh-pages > /dev/null 2>&1

echo "✔ Deployed successfully!"
