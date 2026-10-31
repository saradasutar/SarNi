#!/bin/sh
# SarNi GitHub cleanup for a LOCAL clone; default: preview only.
set -eu
APPLY=0; OPT=0
for x in "$@"; do case "$x" in --apply) APPLY=1;; --include-optional) OPT=1;; *) echo "Unknown argument: $x" >&2; exit 1;; esac; done
if [ ! -d .git ] || [ ! -f index.html ] || [ ! -f app-v20-10-3.js ] || ! grep -q 'app-v20-10-3.js' index.html; then
 echo 'STOP: Run only from an up-to-date SarNi Git repository clone (FE v20.10.3)' >&2
 exit 1
fi
for file in 'app-v20-10-0.js' 'app-v20-10-1.js' 'app-v20-10-2.js' 'app-v20-7-0.js' 'app-v20-8-10.js' 'app-v20-8-11.js' 'app-v20-8-12.js' 'app-v20-8-13.js' 'app-v20-8-14.js' 'app-v20-8-16.js' 'app-v20-8-17.js' 'app-v20-8-18.js' 'app-v20-8-19.js' 'app-v20-8-3.js' 'app-v20-8-6.js' 'app-v20-8-7.js' 'app-v20-8-8.js' 'app-v20-8-9.js' 'app-v20-9-0.js' 'app-v20-9-1.js' 'app-v20-9-2.js' 'sarni-diary-knowledge-v1.css' 'sarni-diary-knowledge-v1.js' 'sarni-family-planner-v20-8-15.css' 'sarni-family-planner-v20-8-15.js' 'sarni-security-storage - Copy.js' 'sarni-ux-v20-9-1.css' 'sarni-ux-v20-9-1.js' 'smart-paste-v20-8-3.js'; do
 if [ -f "$file" ]; then printf '%s: %s\n' "$( [ "$APPLY" -eq 1 ] && echo 'DELETE' || echo 'PREVIEW' )" "$file"; if [ "$APPLY" -eq 1 ];then rm -- "$file"; fi; fi
done
if [ "$OPT" -eq 1 ];then
 for file in 'DIRECT-HOSTING-20261017.md' 'HISTORY-SEARCH-v20.9.2.md' 'INSTALL-FIRST.md' 'INSTALL-LIVE-STEPS.txt' 'INSTALL_v20.10.3.md' 'IndexApp.html' 'QA_RESULTS.md' 'QUALITY-CHECK.md' 'QUALITY_REVIEW_v20.9.2.md' 'README-FIRST.txt' 'RELEASE_20.10.0.md' 'RELEASE_20.10.1.md' 'RELEASE_20.10.2.md' 'RELEASE_v20.9.1.md' 'SARNI-20.8.8-RELEASE.md' 'SarNi_FE_One_Click_ZIP_Maker.html' 'TEST-RESULTS.md' 'github-direct-preview.html' 'index-backup-20261017-before-delight.html' 'launcher-recovery-20261016.html' 'mobile-preview.png' 'mobile-quick-add.png' 'preview.html' 'repair-login.html' 'small-mobile-preview.png'; do
 if [ -f "$file" ]; then printf '%s: %s\n' "$( [ "$APPLY" -eq 1 ] && echo 'DELETE' || echo 'PREVIEW' )" "$file"; if [ "$APPLY" -eq 1 ];then rm -- "$file"; fi; fi
 done
fi
printf '\n%s\n' "$( [ "$APPLY" -eq 1 ] && echo 'Review deletions and Commit/Push in GitHub Desktop.' || echo 'Nothing deleted. Re-run with --apply to delete safe obsolete files.' )"
