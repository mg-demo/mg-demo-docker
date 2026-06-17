#!/bin/sh
# Lightweight secret scanner used locally before building image
# Checks for common secret patterns in files
set -e
echo "Running lightweight secret scan..."
if grep -R -I -q -E --exclude-dir={.git,node_modules,vendor,dist,build} "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)" . ; then
  echo "Potential secret found. Please review and remove before building." >&2
  exit 2
fi
# Also check environment variables for runtime-injected secrets
if env | grep -q -E "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)" ; then
  echo "Potential secret found in environment variables. Please review and unset before building." >&2
  exit 2
fi
echo "No obvious secrets found."
