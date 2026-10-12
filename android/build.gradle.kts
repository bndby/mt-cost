// AGP 9.4.1 needs Gradle 9.8.1 in android/gradle/wrapper. Gradle 9.4.1 fails configuration with NoClassDefFoundError ProjectTypeBinding.
plugins {
    id("com.android.application") version "9.4.1" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.4.21" apply false
}

buildscript {
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.4.21")
    }
}
