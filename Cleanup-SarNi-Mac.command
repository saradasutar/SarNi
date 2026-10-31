#!/bin/sh
set -eu
cd "$(dirname "$0")"
printf '\nSarNi Cleanup — PREVIEW ONLY\n'
if ! sh ./remove-old-sarni-files.sh; then
 printf '\nPREVIEW FAILED. No files were deleted.\n'
 printf 'Press Return to exit...'; read x || true
 exit 1
fi
printf '\nTo remove ONLY the unused old assets shown above, type DELETE.\n'
printf 'Confirmation: '; read reply || reply=''
if [ "$reply" != 'DELETE' ]; then
 printf 'Cancelled. Nothing deleted.\n'; exit 0
fi
sh ./remove-old-sarni-files.sh --apply
printf '\nNEXT: Review deletions in GitHub Desktop, then Commit and Push.\n'
printf 'Do not commit the temporary cleanup scripts. Press Return to exit...'; read x || true
