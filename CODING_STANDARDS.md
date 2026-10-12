# Coding standards

Read during review. The build files are the source of versions and dependency coordinates; this file holds the choices those files do not state.

## Kotlin on AGP 9

AGP 9 compiles Kotlin itself. The app module applies `com.android.application` and `org.jetbrains.kotlin.plugin.compose`. It does not apply `org.jetbrains.kotlin.android`.

One Kotlin version, in the root `plugins` block. A `buildscript` classpath on `org.jetbrains.kotlin:kotlin-gradle-plugin` is a second declaration of that version.
