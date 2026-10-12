import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

fun loadDotEnv(file: File): Map<String, String> {
    if (!file.exists()) return emptyMap()
    val map = linkedMapOf<String, String>()
    file.readLines().forEach { raw ->
        val line = raw.trim()
        if (line.isEmpty() || line.startsWith("#")) return@forEach
        val idx = line.indexOf('=')
        if (idx <= 0) return@forEach
        val key = line.substring(0, idx).trim()
        var value = line.substring(idx + 1).trim()
        if (value.length >= 2 &&
            ((value.startsWith("\"") && value.endsWith("\"")) ||
                (value.startsWith("'") && value.endsWith("'")))
        ) {
            value = value.substring(1, value.length - 1)
        }
        map[key] = value
    }
    return map
}

fun envOr(env: Map<String, String>, key: String, default: String): String {
    val value = env[key]?.trim().orEmpty().ifEmpty { default }
    val number = value.toDoubleOrNull()
    if (number == null || number <= 0.0) {
        throw GradleException("$key is required")
    }
    return value
}

fun javaString(value: String): String =
    "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

val env = loadDotEnv(rootProject.file("../.env"))
val applicationIdValue = env["WG_APPLICATION_ID"]?.trim().orEmpty()
if (applicationIdValue.isEmpty()) {
    throw GradleException("WG_APPLICATION_ID is required in .env")
}

val keystoreProps = Properties().apply {
    val file = rootProject.file("keystore.properties")
    if (file.exists()) {
        file.inputStream().use { load(it) }
    }
}
val hasReleaseKey = !keystoreProps.getProperty("storeFile").isNullOrBlank()

android {
    namespace = "by.bnd.wotcost"
    compileSdk = 37

    defaultConfig {
        applicationId = "by.bnd.wotcost"
        minSdk = 26
        targetSdk = 36
        // Local builds stay at 1. CI passes -Pwotcost.versionCode.
        versionCode = (findProperty("wotcost.versionCode") as String?)?.toInt() ?: 1
        versionName = "1.0.0"
        buildConfigField("String", "WG_APPLICATION_ID", javaString(applicationIdValue))
        buildConfigField("double", "SILVER_PER_GOLD", envOr(env, "WG_SILVER_PER_GOLD", "400"))
        buildConfigField("double", "GOLD_PER_BOND", envOr(env, "WG_GOLD_PER_BOND", "1.6"))
        buildConfigField("double", "FREE_XP_PER_GOLD", envOr(env, "WG_FREE_XP_PER_GOLD", "25"))
        buildConfigField("double", "EU_GOLD", envOr(env, "WG_EU_GOLD_PACK_GOLD", "30500"))
        buildConfigField("double", "EU_MONEY", envOr(env, "WG_EU_GOLD_PACK_EUR", "99.99"))
        buildConfigField("double", "NA_GOLD", envOr(env, "WG_NA_GOLD_PACK_GOLD", "25000"))
        buildConfigField("double", "NA_MONEY", envOr(env, "WG_NA_GOLD_PACK_USD", "99.99"))
        buildConfigField("double", "ASIA_GOLD", envOr(env, "WG_ASIA_GOLD_PACK_GOLD", "25000"))
        buildConfigField("double", "ASIA_MONEY", envOr(env, "WG_ASIA_GOLD_PACK_CNY", "625"))
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    signingConfigs {
        // CI writes this file before assembleDebug so GitHub Release APKs share one key.
        val debugStore = file("debug.keystore")
        if (debugStore.exists()) {
            getByName("debug") {
                storeFile = debugStore
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
        if (hasReleaseKey) {
            create("release") {
                storeFile = file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            if (hasReleaseKey) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.11.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.11.0")
    implementation("androidx.lifecycle:lifecycle-process:2.11.0")
    implementation("androidx.core:core-ktx:1.19.1")
    implementation("androidx.browser:browser:1.10.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
}
