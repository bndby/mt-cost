package by.bnd.wotcost.domain

import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

private val REALMS = listOf(Realm.NA, Realm.EU, Realm.ASIA)

private data class CallbackAuth(
    val accessToken: String,
    val expiresAt: Long,
    val accountId: Long,
    val nick: String,
)

private enum class SettingsLevel { Root, Theme, Language }

private data class LiveAuth(
    val accessToken: String,
    val expiresAt: Long,
    val accountId: Long,
    val nick: String,
    val realm: Realm,
)

class PlayerSession(
    private val customTab: CustomTab,
    private val wgForRealm: (Realm) -> WgClient,
    private val clock: Clock,
    private val config: PlayerSessionConfig,
    initialLanguage: LanguagePreference = LanguagePreference.Device,
    initialTheme: ThemePreference = ThemePreference.System,
    private val deviceTags: () -> List<String> = { emptyList() },
    private val systemInDarkTheme: () -> Boolean = { true },
    private val onLanguageChange: ((LanguagePreference) -> Unit)? = null,
    private val onThemeChange: ((ThemePreference) -> Unit)? = null,
    private val scope: CoroutineScope,
) {
    private val listeners = LinkedHashSet<() -> Unit>()
    private var preference: LanguagePreference = initialLanguage
    private var language: LanguageId = resolve(initialLanguage)
    private var theme: ThemePreference = initialTheme
    private var settings: SettingsLevel? = null
    private var underlying: Screen = chooseRealmScreen(null)
    private var auth: LiveAuth? = null
    private var clanTag: String? = null
    private var selectedRealm: Realm? = null
    private var client: WgClient? = null
    private var collectGeneration = 0

    fun screen(): Screen = visible()

    fun subscribe(listener: () -> Unit): () -> Unit {
        listeners.add(listener)
        return { listeners.remove(listener) }
    }

    suspend fun chooseRealm(key: Realm) {
        if (underlying !is Screen.ChooseRealm) return
        selectedRealm = key
        show(chooseRealmScreen(key))
        val result = customTab.open(openIdLoginUrl(key.origin, config.wgApplicationId))
        if (result !is CustomTabResult.Success) return
        val parsed = parseCallback(result.url) ?: return
        beginLive(parsed, key)
    }

    fun themePreference(): ThemePreference = theme

    fun openSettings() {
        if (settings != null) return
        settings = SettingsLevel.Root
        emit()
    }

    fun openThemeSettings() {
        if (settings == null) return
        settings = SettingsLevel.Theme
        emit()
    }

    fun openLanguageSettings() {
        if (settings == null) return
        settings = SettingsLevel.Language
        emit()
    }

    fun closeSettings() {
        settings = when (settings) {
            null -> return
            SettingsLevel.Root -> null
            SettingsLevel.Theme, SettingsLevel.Language -> SettingsLevel.Root
        }
        emit()
    }

    fun setTheme(next: ThemePreference) {
        if (next == theme) return
        theme = next
        onThemeChange?.invoke(next)
        emit()
    }

    fun setLanguage(id: LanguageId) {
        chooseLanguage(LanguagePreference.Fixed(id))
    }

    fun followDeviceLanguage() {
        chooseLanguage(LanguagePreference.Device)
    }

    fun syncLanguage(next: LanguagePreference) {
        val resolved = resolve(next)
        val textChanged = resolved != language
        preference = next
        language = resolved
        if (textChanged) publishLanguageBody() else emit()
    }

    private fun chooseLanguage(next: LanguagePreference) {
        if (next == preference) return
        val resolved = resolve(next)
        val textChanged = resolved != language
        preference = next
        language = resolved
        onLanguageChange?.invoke(next)
        if (textChanged) publishLanguageBody() else emit()
    }

    private fun resolve(next: LanguagePreference): LanguageId = when (next) {
        LanguagePreference.Device -> languageFromDevice(deviceTags())
        is LanguagePreference.Fixed -> next.id
    }

    private fun publishLanguageBody() {
        val current = underlying
        when {
            current is Screen.ChooseRealm -> show(chooseRealmScreen(selectedRealm))
            current is Screen.Valuation && current.snapshot is ValuationSnapshot.Dashes ->
                show(withValuation(current.snapshot, copy(language).retry))
            current is Screen.Valuation -> scope.launch { collect() }
            else -> emit()
        }
    }

    suspend fun signOut() {
        val token = auth?.accessToken
        val toLogout = client
        forgetAuth()
        if (token != null && toLogout != null) toLogout.logout(token)
    }

    suspend fun retry() {
        if (auth == null) return
        val current = underlying
        if (current is Screen.Valuation && current.snapshot is ValuationSnapshot.Waiting) return
        collect()
    }

    suspend fun onForeground() {
        refreshAuth()
    }

    private fun chooseRealmScreen(selected: Realm?): Screen {
        val text = copy(language)
        return Screen.ChooseRealm(
            title = text.realmTitle,
            headline = text.headline,
            description = text.description,
            settingsLabel = text.settings,
            realms = REALMS.map { key ->
                RealmChoice(key = key, name = text.realms.getValue(key), selected = key == selected)
            },
        )
    }

    private fun valuationRates(): ValuationRates {
        val realm = auth?.realm ?: Realm.EU
        val pack = config.goldPacks.getValue(realm)
        return ValuationRates(
            silverPerGold = config.silverPerGold,
            goldPackGold = pack.gold,
            goldPackMoney = pack.money,
            goldPerBond = config.goldPerBond,
            freeXpPerGold = config.freeXpPerGold,
            premiumPackages = WG_PREMIUM_PACKAGES,
        )
    }

    private fun visible(): Screen {
        val level = settings ?: return underlying
        val text = copy(language)
        val title = when (level) {
            SettingsLevel.Root -> text.settings
            SettingsLevel.Theme -> text.theme
            SettingsLevel.Language -> text.language
        }
        val page = when (level) {
            SettingsLevel.Root -> SettingsPage.Root(settingsRoot(text))
            SettingsLevel.Theme -> SettingsPage.Theme(themeOptions(text))
            SettingsLevel.Language -> SettingsPage.Language(
                buildLanguageCatalog(text, preference, language, deviceTags()),
            )
        }
        return Screen.Settings(title = title, backLabel = text.back, page = page)
    }

    private fun settingsRoot(text: Copy): SettingsRoot {
        val themeValue = when (theme) {
            ThemePreference.System -> text.themeSystem
            ThemePreference.Light -> text.themeLight
            ThemePreference.Dark -> text.themeDark
        }
        val languageValue = when (val chosen = preference) {
            LanguagePreference.Device -> text.languageDevice
            is LanguagePreference.Fixed -> nativeName(chosen.id)
        }
        return SettingsRoot(
            themeLabel = text.theme,
            themeValue = themeValue,
            languageLabel = text.language,
            languageValue = languageValue,
        )
    }

    private fun themeOptions(text: Copy): List<ThemeOption> {
        val resolved = if (systemInDarkTheme()) text.themeDark else text.themeLight
        return listOf(
            ThemeOption(ThemePreference.System, text.themeSystem, resolved, theme == ThemePreference.System),
            ThemeOption(ThemePreference.Light, text.themeLight, null, theme == ThemePreference.Light),
            ThemeOption(ThemePreference.Dark, text.themeDark, null, theme == ThemePreference.Dark),
        )
    }

    private fun emit() {
        for (listener in listeners.toList()) listener()
    }

    private fun show(next: Screen) {
        underlying = next
        emit()
    }

    private fun forgetAuth() {
        collectGeneration += 1
        auth = null
        clanTag = null
        selectedRealm = null
        client = null
        settings = null
        show(chooseRealmScreen(null))
    }

    private fun kicker(): String {
        val live = auth ?: return ""
        val who = clanTag?.let { "[$it] ${live.nick}" } ?: live.nick
        return "[${live.realm.name}] $who"
    }

    private fun beginLive(parsed: CallbackAuth, realm: Realm) {
        auth = LiveAuth(
            accessToken = parsed.accessToken,
            expiresAt = parsed.expiresAt,
            accountId = parsed.accountId,
            nick = parsed.nick,
            realm = realm,
        )
        client = wgForRealm(realm)
        scope.launch { collect() }
        scope.launch { loadClanTag() }
    }

    private suspend fun refreshAuth(): Boolean {
        val live = auth ?: return false
        val liveClient = client ?: return false
        if (clock.nowUnixSeconds < live.expiresAt) return true
        when (val prolonged = liveClient.prolongate(live.accessToken)) {
            Prolongate.Failed -> {
                forgetAuth()
                return false
            }
            is Prolongate.Ok -> {
                auth = live.copy(
                    accessToken = prolonged.accessToken,
                    expiresAt = prolonged.expiresAt,
                )
                return true
            }
        }
    }

    private fun withValuation(snapshot: ValuationSnapshot, retryLabel: String?): Screen {
        val text = copy(language)
        return Screen.Valuation(
            signOutLabel = text.signOut,
            retryLabel = retryLabel,
            settingsLabel = text.settings,
            kicker = kicker(),
            symbol = auth?.realm?.symbol ?: "€",
            snapshot = snapshot,
        )
    }

    private suspend fun loadClanTag() {
        val current = auth ?: return
        val currentClient = client ?: return
        try {
            val tag = currentClient.fetchClanTag(current.accountId)
            if (auth?.accountId != current.accountId) return
            clanTag = tag
            if (underlying is Screen.Valuation) {
                show((underlying as Screen.Valuation).copy(kicker = kicker()))
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            // Missing tag stays the nick; clan failure is not a failed Оценка.
        }
    }

    private suspend fun collect() {
        if (auth == null || client == null) return
        val generation = ++collectGeneration
        val catalogLanguage = encyclopediaLanguage(language)
        show(withValuation(ValuationSnapshot.Waiting, null))
        if (!refreshAuth()) return
        if (generation != collectGeneration || auth == null) return
        val live = auth ?: return
        val liveClient = client ?: return
        show(withValuation(ValuationSnapshot.Waiting, null))
        try {
            val account = liveClient.fetchAccount(live.accessToken, live.accountId)
            if (generation != collectGeneration || auth == null) return
            val tankIds = uniqueTankIds(account.hangarTankIds, account.rented)
            val prices = if (tankIds.isEmpty()) {
                emptyList()
            } else {
                liveClient.fetchVehiclePrices(tankIds, catalogLanguage)
            }
            if (generation != collectGeneration || auth == null) return
            val ownedBoosters = account.boosters.filter { it.state != "USED" && it.count > 0 }
            val boosterPrices = if (ownedBoosters.isEmpty()) {
                emptyList()
            } else {
                liveClient.fetchBoosterPrices(catalogLanguage)
            }
            if (generation != collectGeneration || auth == null) return
            val (hero, rows) = valueAccount(
                account,
                tankIds,
                prices,
                boosterPrices,
                valuationRates(),
                clock.nowUnixSeconds,
                copy(language).rows,
            )
            show(withValuation(ValuationSnapshot.Numbers(hero, rows), copy(language).retry))
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            if (generation != collectGeneration || auth == null) return
            show(withValuation(ValuationSnapshot.Dashes, copy(language).retry))
        }
    }
}

private fun parseCallback(url: String): CallbackAuth? {
    val parsed = URI(url)
    val params = queryMap(parsed.rawQuery)
    val status = params["status"]
    val message = params["message"] ?: ""
    if (status == "error" || message.startsWith("AUTH_")) return null
    val accessToken = params["access_token"]
    val expiresAt = params["expires_at"]?.toDoubleOrNull()
    val accountId = params["account_id"]?.toDoubleOrNull()
    if (accessToken.isNullOrEmpty() || expiresAt == null || !expiresAt.isFinite() ||
        accountId == null || !accountId.isFinite()
    ) {
        return null
    }
    return CallbackAuth(
        accessToken = accessToken,
        expiresAt = expiresAt.toLong(),
        accountId = accountId.toLong(),
        nick = params["nickname"] ?: "",
    )
}

private fun queryMap(raw: String?): Map<String, String> {
    if (raw.isNullOrEmpty()) return emptyMap()
    val utf8 = StandardCharsets.UTF_8
    return raw.split('&').mapNotNull { part ->
        if (part.isEmpty()) return@mapNotNull null
        val idx = part.indexOf('=')
        val key = URLDecoder.decode(if (idx >= 0) part.substring(0, idx) else part, utf8)
        val value = URLDecoder.decode(if (idx >= 0) part.substring(idx + 1) else "", utf8)
        key to value
    }.toMap()
}

internal fun openIdLoginUrl(origin: String, applicationId: String): String {
    val utf8 = StandardCharsets.UTF_8
    val login = "$origin/wot/auth/login/"
    return login +
        "?application_id=" + URLEncoder.encode(applicationId, utf8) +
        "&redirect_uri=" + URLEncoder.encode(OPEN_ID_REDIRECT_URI, utf8) +
        "&display=page"
}
