#!/bin/sh
# Lightweight secret scanner used locally before building image
# Checks for common secret patterns in files
echo "Running lightweight secret scan..."
if [ "${CI:-}" != "true" ] && grep -R -I -q -m 1 -E --exclude-dir={.git,node_modules,vendor,dist,build} "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|aws(.{0,20})?(secret|access)[._-]?key(.{0,3})?:?.{0,3}[A-Za-z0-9/+=]{40}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,255}|xox[baprs]-[A-Za-z0-9-]{10,48}|sk_(live|test)_[0-9a-zA-Z]{24}|AIza[0-9A-Za-z_-]{35})" . ; then
  echo "Potential secret found. Please review and remove before building." >&2
  exit 2
fi
echo "No obvious secrets found."
