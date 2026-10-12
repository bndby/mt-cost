package by.bnd.wotcost

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.viewModelScope
import by.bnd.wotcost.auth.AuthBridge
import by.bnd.wotcost.domain.Clock
import by.bnd.wotcost.domain.GoldPack
import by.bnd.wotcost.domain.LanguageId
import by.bnd.wotcost.domain.LanguagePreference
import by.bnd.wotcost.domain.PlayerSession
import by.bnd.wotcost.domain.PlayerSessionConfig
import by.bnd.wotcost.domain.Realm
import by.bnd.wotcost.domain.ThemePreference
import by.bnd.wotcost.domain.matchingDeviceLanguage
import by.bnd.wotcost.wg.HttpWg
import by.bnd.wotcost.wg.OkHttpTransport
import kotlinx.coroutines.launch

private const val PREFS = "wotcost"
private const val LANGUAGE = "language"
private const val LANGUAGE_MIGRATED = "language_migrated"
private const val THEME = "theme"

fun migrateLanguagePreference(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (prefs.getBoolean(LANGUAGE_MIGRATED, false)) return
    val legacy = prefs.getString(LANGUAGE, null)?.let(LanguageId::fromCode)
    prefs.edit().putBoolean(LANGUAGE_MIGRATED, true).remove(LANGUAGE).apply()
    if (legacy != null && AppCompatDelegate.getApplicationLocales().isEmpty) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(legacy.code))
    }
}

fun platformLanguagePreference(): LanguagePreference {
    val locales = AppCompatDelegate.getApplicationLocales()
    if (locales.isEmpty) return LanguagePreference.Device
    val tag = locales.get(0)?.toLanguageTag() ?: return LanguagePreference.Device
    val matched = matchingDeviceLanguage(listOf(tag))
    return if (matched == null) LanguagePreference.Device else LanguagePreference.Fixed(matched)
}

private object WallClock : Clock {
    override val nowUnixSeconds: Long
        get() = System.currentTimeMillis() / 1000L
}

class SessionViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val transport = OkHttpTransport()

    val session: PlayerSession = PlayerSession(
        customTab = AuthBridge,
        wgForRealm = { realm ->
            HttpWg(
                origin = realm.origin,
                applicationId = BuildConfig.WG_APPLICATION_ID,
                http = transport::get,
            )
        },
        clock = WallClock,
        config = PlayerSessionConfig(
            wgApplicationId = BuildConfig.WG_APPLICATION_ID,
            silverPerGold = BuildConfig.SILVER_PER_GOLD,
            goldPerBond = BuildConfig.GOLD_PER_BOND,
            freeXpPerGold = BuildConfig.FREE_XP_PER_GOLD,
            goldPacks = mapOf(
                Realm.EU to GoldPack(BuildConfig.EU_GOLD, BuildConfig.EU_MONEY),
                Realm.NA to GoldPack(BuildConfig.NA_GOLD, BuildConfig.NA_MONEY),
                Realm.ASIA to GoldPack(BuildConfig.ASIA_GOLD, BuildConfig.ASIA_MONEY),
            ),
        ),
        initialLanguage = platformLanguagePreference(),
        initialTheme = themeFromStorage(prefs.getString(THEME, null)),
        deviceTags = { systemLocaleTags() },
        systemInDarkTheme = { systemInDarkTheme(app) },
        onLanguageChange = { preference ->
            AppCompatDelegate.setApplicationLocales(preference.toLocaleList())
        },
        onThemeChange = { preference ->
            prefs.edit().putString(THEME, preference.storageKey()).apply()
        },
        scope = viewModelScope,
    )

    fun syncPlatformLanguage() {
        session.syncLanguage(platformLanguagePreference())
    }

    private val foreground = object : DefaultLifecycleObserver {
        override fun onStart(owner: LifecycleOwner) {
            syncPlatformLanguage()
            viewModelScope.launch { session.onForeground() }
        }
    }

    init {
        ProcessLifecycleOwner.get().lifecycle.addObserver(foreground)
    }

    override fun onCleared() {
        ProcessLifecycleOwner.get().lifecycle.removeObserver(foreground)
    }
}

private fun systemLocaleTags(): List<String> {
    val locales = Resources.getSystem().configuration.locales
    return buildList {
        for (index in 0 until locales.size()) {
            add(locales[index].toLanguageTag())
        }
    }
}

private fun systemInDarkTheme(context: Context): Boolean {
    val night = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return night == Configuration.UI_MODE_NIGHT_YES
}

private fun ThemePreference.storageKey(): String = when (this) {
    ThemePreference.System -> "system"
    ThemePreference.Light -> "light"
    ThemePreference.Dark -> "dark"
}

private fun themeFromStorage(value: String?): ThemePreference = when (value) {
    "light" -> ThemePreference.Light
    "dark" -> ThemePreference.Dark
    else -> ThemePreference.System
}

private fun LanguagePreference.toLocaleList(): LocaleListCompat = when (this) {
    LanguagePreference.Device -> LocaleListCompat.getEmptyLocaleList()
    is LanguagePreference.Fixed -> LocaleListCompat.forLanguageTags(id.code)
}
