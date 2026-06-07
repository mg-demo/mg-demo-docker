#!/bin/sh
# Lightweight secret scanner used locally before building image
# Checks for common secret patterns in files
set -e
echo "Running lightweight secret scan..."
if grep -R -I -q -E "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|[A-Za-z0-9+/]{40,}={0,2})" . ; then
  echo "Potential secret found. Please review and remove before building." >&2
  exit 2
fi
echo "No obvious secrets found."
