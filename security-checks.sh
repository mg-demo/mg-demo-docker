#!/bin/sh
# Lightweight secret scanner used locally before building image
# Checks for common secret patterns in files
set -e
echo "Running lightweight secret scan..."
if grep -R --line-number -E "(AKIA|api_key|API_KEY|secret|password|PRIVATE_KEY)" . ; then
  echo "Potential secret found. Please review and remove before building." >&2
  exit 2
fi
echo "No obvious secrets found."
