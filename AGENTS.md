## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical roles map 1:1 to tracker labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Android AAB

Play App Bundle is a host Gradle build (`scripts/build-android-aab.sh`). A push builds a debug APK in GitHub Actions; a push to `master` also builds a signed AAB artifact and does not upload it to Play. Rule: `.cursor/rules/android-aab-gradle.mdc`.
