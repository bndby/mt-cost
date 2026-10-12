package by.bnd.wotcost

import by.bnd.wotcost.domain.AccountSnapshot
import by.bnd.wotcost.domain.BoosterPrice
import by.bnd.wotcost.domain.Clock
import by.bnd.wotcost.domain.ColumnRow
import by.bnd.wotcost.domain.CustomTab
import by.bnd.wotcost.domain.CustomTabResult
import by.bnd.wotcost.domain.GoldPack
import by.bnd.wotcost.domain.LanguageId
import by.bnd.wotcost.domain.LanguagePreference
import by.bnd.wotcost.domain.SettingsPage
import by.bnd.wotcost.domain.ThemePreference
import by.bnd.wotcost.domain.Line
import by.bnd.wotcost.domain.OwnedBooster
import by.bnd.wotcost.domain.PlayerSession
import by.bnd.wotcost.domain.PlayerSessionConfig
import by.bnd.wotcost.domain.Prolongate
import by.bnd.wotcost.domain.Realm
import by.bnd.wotcost.domain.RentedTank
import by.bnd.wotcost.domain.Screen
import by.bnd.wotcost.domain.ValuationSnapshot
import by.bnd.wotcost.domain.VehiclePrice
import by.bnd.wotcost.domain.WgClient
import by.bnd.wotcost.domain.languageFromDevice
import by.bnd.wotcost.domain.openIdLoginUrl
import by.bnd.wotcost.domain.splitMoneyDisplay
import java.net.URI
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayerSessionTest {
    @Test
    fun firstScreenDoesNotOpenTheBrowser() {
        val harness = Harness()
        val screen = harness.session.screen() as Screen.ChooseRealm
        assertEquals("Выберите Реалм", screen.title)
        assertEquals(listOf(Realm.NA, Realm.EU, Realm.ASIA), screen.realms.map { it.key })
        assertTrue(screen.realms.none { it.selected })
        assertTrue(harness.tab.opened.isEmpty())
    }

    @Test
    fun realmOpensWgOpenIdOnThatHost() = runBlocking {
        val harness = Harness()
        harness.tab.next = CustomTabResult.Dismiss
        harness.session.chooseRealm(Realm.EU)
        val opened = URI(harness.tab.opened.single())
        assertEquals("https://api.worldoftanks.eu/wot/auth/login/", opened.scheme + "://" + opened.host + opened.path)
        val query = opened.query.split("&").associate {
            val (key, value) = it.split("=", limit = 2)
            java.net.URLDecoder.decode(key, Charsets.UTF_8) to java.net.URLDecoder.decode(value, Charsets.UTF_8)
        }
        assertEquals("test-application-id", query["application_id"])
        assertEquals("https://bndby.github.io/mt-cost/auth/callback", query["redirect_uri"])
        assertEquals("page", query["display"])
        assertTrue(!query.getValue("redirect_uri").contains("wotcost://"))
        val shown = harness.session.screen() as Screen.ChooseRealm
        assertTrue(shown.realms.single { it.key == Realm.EU }.selected)
    }

    @Test
    fun rejectedLoginStaysOnTheRealmStep() = runBlocking {
        for (result in listOf(
            CustomTabResult.Dismiss,
            CustomTabResult.Success(errorCallback("AUTH_CANCEL")),
            CustomTabResult.Success(errorCallback("AUTH_EXPIRED")),
        )) {
            val harness = Harness()
            harness.tab.next = result
            harness.session.chooseRealm(Realm.EU)
            assertTrue(harness.session.screen() is Screen.ChooseRealm)
            assertTrue("access_token" !in harness.session.screen().toString())
        }
    }

    @Test
    fun successfulLoginShowsWaitingThenTheValuation() = runBlocking {
        val harness = Harness()
        harness.wg.accountGate = CompletableDeferred()
        harness.wg.account = AccountSnapshot(
            silver = 400,
            gold = 50_000,
            bonds = 0,
            hangarTankIds = listOf(11),
        )
        harness.wg.vehicles = listOf(VehiclePrice(11, priceSilver = 400_000, priceGold = null))
        harness.tab.succeed(okCallback())
        harness.session.chooseRealm(Realm.EU)
        val waiting = harness.session.screen() as Screen.Valuation
        assertEquals("[EU] Player", waiting.kicker)
        assertEquals("€", waiting.symbol)
        assertNull(waiting.retryLabel)
        assertTrue(waiting.snapshot is ValuationSnapshot.Waiting)
        harness.wg.accountGate.complete(Unit)
        val numbers = harness.session.numbers()
        assertEquals(102.002, numbers.heroAmount, 1e-9)
        assertEquals(3, numbers.rows.size)
        assertRow(numbers.rows[0], Line.Gold, "Золото", 50_000, 100.0)
        assertRow(numbers.rows[1], Line.Silver, "Серебро", 400, 0.002)
        assertRow(numbers.rows[2], Line.Researchable, "Танки", 1, 2.0)
        assertEquals("Повторить", (harness.session.screen() as Screen.Valuation).retryLabel)
    }

    @Test
    fun emptyAccountIsZeroWithoutDashes() = runBlocking {
        val harness = signedIn()
        val numbers = harness.session.numbers()
        assertEquals(0.0, numbers.heroAmount, 0.0)
        assertTrue(numbers.rows.isEmpty())
    }

    @Test
    fun bondsUseTheAgreedRate() = runBlocking {
        val harness = signedIn(AccountSnapshot(silver = 0, gold = 0, bonds = 10))
        val numbers = harness.session.numbers()
        assertEquals(0.032, numbers.heroAmount, 1e-9)
        assertRow(numbers.rows.single(), Line.Bonds, "Боны", 10, 0.032)
    }

    @Test
    fun premiumAccountBreaksDaysIntoGoldPacks() = runBlocking {
        val harness = Harness()
        harness.wg.account = AccountSnapshot(
            silver = 0,
            gold = 0,
            bonds = 0,
            premiumExpiresAt = harness.clock.nowUnixSeconds + 10 * 86_400,
        )
        signIn(harness)
        val ten = harness.session.numbers()
        assertRow(ten.rows.single(), Line.PremiumAccount, "Прем. акк", 10, 3.8)

        val year = Harness()
        year.wg.account = AccountSnapshot(
            silver = 0,
            gold = 0,
            bonds = 0,
            premiumExpiresAt = year.clock.nowUnixSeconds + 360 * 86_400,
        )
        signIn(year)
        assertRow(year.session.numbers().rows.single(), Line.PremiumAccount, "Прем. акк", 360, 41.0)
    }

    @Test
    fun freeXpAndGiftTanksAndBoosters() = runBlocking {
        val xp = signedIn(AccountSnapshot(silver = 0, gold = 0, bonds = 0, freeXp = 25_000))
        assertRow(xp.session.numbers().rows.single(), Line.FreeXp, "Своб. опыт", 25_000, 2.0)

        val gift = Harness()
        gift.wg.account = AccountSnapshot(silver = 0, gold = 0, bonds = 0, hangarTankIds = listOf(8))
        gift.wg.vehicles = listOf(VehiclePrice(8, 0, 0, tier = 8, isGift = true))
        signIn(gift)
        assertTrue(gift.session.numbers().rows.isEmpty())

        val boosters = Harness()
        boosters.wg.account = AccountSnapshot(
            silver = 0,
            gold = 0,
            bonds = 0,
            boosters = listOf(
                OwnedBooster(121001, 2, "INACTIVE"),
                OwnedBooster(121000, 1, "ACTIVE"),
                OwnedBooster(9, 4, "USED"),
            ),
        )
        boosters.wg.boosterPrices = listOf(
            BoosterPrice(121001, 150),
            BoosterPrice(121000, 100),
            BoosterPrice(9, 50),
        )
        signIn(boosters)
        assertRow(boosters.session.numbers().rows.single(), Line.Boosters, "Резервы", 3, 0.8)
    }

    @Test
    fun tanksUseGoldWhenBothPricesExistAndIgnoreRentCompensation() = runBlocking {
        val both = Harness()
        both.wg.account = AccountSnapshot(silver = 0, gold = 0, bonds = 0, hangarTankIds = listOf(7))
        both.wg.vehicles = listOf(VehiclePrice(7, priceSilver = 400_000, priceGold = 2_500))
        signIn(both)
        assertRow(both.session.numbers().rows.single(), Line.Premium, "Прем. танки", 1, 5.0)

        val rented = Harness()
        rented.wg.account = AccountSnapshot(
            silver = 0,
            gold = 0,
            bonds = 0,
            hangarTankIds = listOf(1, 2, 2),
            rented = listOf(
                RentedTank(3, 1_000_000, 500),
                RentedTank(1, 50, 0),
            ),
        )
        rented.wg.vehicles = listOf(
            VehiclePrice(1, priceSilver = 400_000, priceGold = null),
            VehiclePrice(2, priceSilver = null, priceGold = 2_500),
        )
        signIn(rented)
        val rows = rented.session.numbers().rows
        assertEquals(7.0, rented.session.numbers().heroAmount, 1e-9)
        assertRow(rows[0], Line.Premium, "Прем. танки", 1, 5.0)
        assertRow(rows[1], Line.Researchable, "Танки", 1, 2.0)
    }

    @Test
    fun failureShowsDashesAndRetryReplacesThem() = runBlocking {
        val harness = Harness()
        harness.wg.accountError = IllegalStateException("ECONNRESET")
        signIn(harness)
        val dashes = harness.session.screen() as Screen.Valuation
        assertTrue(dashes.snapshot is ValuationSnapshot.Dashes)
        assertEquals("Повторить", dashes.retryLabel)
        assertTrue("ECONNRESET" !in dashes.toString())

        harness.wg.accountError = null
        harness.wg.account = AccountSnapshot(silver = 0, gold = 50_000, bonds = 0)
        harness.wg.accountGate = CompletableDeferred()
        val retrying = harness.scope.launch { harness.session.retry() }
        assertTrue((harness.session.screen() as Screen.Valuation).snapshot is ValuationSnapshot.Waiting)
        harness.wg.accountGate.complete(Unit)
        retrying.join()
        assertEquals(100.0, harness.session.numbers().heroAmount, 1e-9)
    }

    @Test
    fun foregroundDoesNotRecollectAndExpiredTokenReturnsToRealms() = runBlocking {
        val harness = signedIn(AccountSnapshot(silver = 0, gold = 50_000, bonds = 0))
        harness.wg.account = AccountSnapshot(silver = 0, gold = 2_500, bonds = 0)
        harness.session.onForeground()
        assertEquals(100.0, harness.session.numbers().heroAmount, 1e-9)

        val expired = Harness()
        expired.tab.succeed(okCallback(expiresAt = expired.clock.nowUnixSeconds + 10))
        expired.wg.account = AccountSnapshot(silver = 0, gold = 50_000, bonds = 0)
        expired.session.chooseRealm(Realm.EU)
        expired.clock.nowUnixSeconds += 11
        expired.wg.prolongateResult = Prolongate.Failed
        expired.tab.opened.clear()
        expired.session.onForeground()
        assertTrue(expired.session.screen() is Screen.ChooseRealm)
        assertTrue(expired.tab.opened.isEmpty())
    }

    @Test
    fun clanTagKeepsCaseAndIsNotRefetchedOnRetry() = runBlocking {
        val harness = Harness()
        harness.wg.clan = "xYz"
        harness.tab.succeed(okCallback(nickname = "pLaYeR"))
        harness.session.chooseRealm(Realm.NA)
        val screen = harness.session.screen() as Screen.Valuation
        assertEquals("[NA] [xYz] pLaYeR", screen.kicker)
        assertEquals("$", screen.symbol)
        assertEquals(1, harness.wg.clanCalls)

        harness.wg.clan = "BLUE"
        harness.session.retry()
        assertEquals("[NA] [xYz] pLaYeR", (harness.session.screen() as Screen.Valuation).kicker)
        assertEquals(1, harness.wg.clanCalls)
    }

    @Test
    fun clanFailureLeavesTheNick() = runBlocking {
        val harness = Harness()
        harness.wg.clanError = IllegalStateException("clan")
        signIn(harness, nickname = "Nick")
        assertEquals("[EU] Nick", (harness.session.screen() as Screen.Valuation).kicker)
        assertTrue(harness.session.screen() is Screen.Valuation)
    }

    @Test
    fun signOutForgetsTheTokenAndCallsLogout() = runBlocking {
        val harness = Harness()
        harness.tab.succeed(okCallback(accessToken = "live-token"))
        harness.session.chooseRealm(Realm.ASIA)
        harness.session.signOut()
        assertTrue(harness.session.screen() is Screen.ChooseRealm)
        assertEquals(listOf("live-token"), harness.wg.logoutCalls)
        assertEquals("¥", Realm.ASIA.symbol)
    }

    @Test
    fun languageChangesLabelsAndReloadsAReadyValuation() = runBlocking {
        val signedOut = Harness()
        signedOut.session.openSettings()
        signedOut.session.setLanguage(LanguageId.De)
        val settings = signedOut.session.screen() as Screen.Settings
        assertEquals("Einstellungen", settings.title)
        signedOut.session.closeSettings()
        val realms = signedOut.session.screen() as Screen.ChooseRealm
        assertEquals("Realm wählen", realms.title)
        assertTrue(signedOut.wg.encyclopediaLanguages.isEmpty())

        val harness = Harness()
        harness.wg.account = AccountSnapshot(silver = 0, gold = 0, bonds = 0, hangarTankIds = listOf(1))
        harness.wg.vehicles = listOf(VehiclePrice(1, priceSilver = 400, priceGold = 0))
        signIn(harness)
        harness.session.setLanguage(LanguageId.Ja)
        assertEquals(listOf("ru", "en"), harness.wg.encyclopediaLanguages)
        assertEquals("ログアウト", (harness.session.screen() as Screen.Valuation).signOutLabel)
        assertEquals("戦車", harness.session.numbers().rows.single().name)

        val failed = Harness()
        failed.wg.accountError = IllegalStateException("down")
        signIn(failed)
        failed.session.setLanguage(LanguageId.En)
        val dashes = failed.session.screen() as Screen.Valuation
        assertEquals("Retry", dashes.retryLabel)
        assertTrue(dashes.snapshot is ValuationSnapshot.Dashes)
        assertTrue(failed.wg.encyclopediaLanguages.isEmpty())
    }

    @Test
    fun deviceLanguageAndMoneyRounding() {
        assertEquals(LanguageId.Pl, languageFromDevice(listOf("pl-PL", "en-US")))
        assertEquals(LanguageId.ZhTw, languageFromDevice(listOf("zh-Hant-TW")))
        assertEquals(LanguageId.ZhCn, languageFromDevice(listOf("zh-Hans-CN")))
        assertEquals(LanguageId.PtBr, languageFromDevice(listOf("pt-PT")))
        assertEquals(LanguageId.Es, languageFromDevice(listOf("es-MX")))
        assertEquals(LanguageId.Ru, languageFromDevice(listOf("th-TH")))
        assertEquals(LanguageId.Ru, languageFromDevice(emptyList()))
        assertEquals("0" to "00", splitMoneyDisplay(0.0))
        assertEquals("00", splitMoneyDisplay(156.0).second)
        assertEquals("23", splitMoneyDisplay(1.225).second)
        assertEquals("24", splitMoneyDisplay(1.235).second)
        assertEquals("99", splitMoneyDisplay(99.994).second)
        assertEquals("64", splitMoneyDisplay(258893.641).second)
        assertTrue(splitMoneyDisplay(12_345.0).first.length > 5)
        assertEquals(
            "https://api.worldoftanks.com/wot/auth/login/",
            openIdLoginUrl("https://api.worldoftanks.com", "app").substringBefore("?"),
        )
    }

    @Test
    fun settingsReturnToTheRootAndThemeStaysChosen() {
        val harness = Harness()
        harness.session.openSettings()
        val root = harness.session.screen() as Screen.Settings
        assertEquals("Настройки", root.title)
        val body = (root.page as SettingsPage.Root).body
        assertEquals("Как на устройстве", body.themeValue)
        assertEquals("Язык устройства", body.languageValue)

        harness.session.openThemeSettings()
        val theme = harness.session.screen() as Screen.Settings
        assertEquals("Тема", theme.title)
        val options = (theme.page as SettingsPage.Theme).options
        assertEquals(ThemePreference.System, options.first().preference)
        assertEquals("Тёмная", options.first().subtitle)
        assertTrue(options.first().selected)

        harness.session.setTheme(ThemePreference.Light)
        val picked = ((harness.session.screen() as Screen.Settings).page as SettingsPage.Theme).options
        assertTrue(picked.single { it.preference == ThemePreference.Light }.selected)
        assertTrue(picked.none { it.preference != ThemePreference.Light && it.selected })

        harness.session.closeSettings()
        assertEquals("Настройки", (harness.session.screen() as Screen.Settings).title)
        assertEquals(
            "Светлая",
            ((harness.session.screen() as Screen.Settings).page as SettingsPage.Root).body.themeValue,
        )
        harness.session.closeSettings()
        assertTrue(harness.session.screen() is Screen.ChooseRealm)
    }

    @Test
    fun deviceLanguageCanBeChosenAgain() = runBlocking {
        val harness = Harness(mutableListOf("pl-PL"))
        assertEquals("Wybierz realm", (harness.session.screen() as Screen.ChooseRealm).title)
        harness.session.openSettings()
        harness.session.openLanguageSettings()
        val catalog = ((harness.session.screen() as Screen.Settings).page as SettingsPage.Language).catalog
        assertTrue(catalog.device.selected)
        assertEquals(
            listOf(LanguageId.Pl, LanguageId.En),
            catalog.suggested.map { (it.preference as LanguagePreference.Fixed).id },
        )
        assertTrue(catalog.all.none { (it.preference as LanguagePreference.Fixed).id == LanguageId.En })
        assertTrue(catalog.all.none { (it.preference as LanguagePreference.Fixed).id == LanguageId.Pl })

        harness.session.setLanguage(LanguageId.Ja)
        assertEquals("言語", (harness.session.screen() as Screen.Settings).title)
        val pinned = ((harness.session.screen() as Screen.Settings).page as SettingsPage.Language).catalog
        assertEquals(LanguageId.Ja, (pinned.suggested.last().preference as LanguagePreference.Fixed).id)
        assertTrue(pinned.suggested.last().selected)
        assertTrue(pinned.device.selected.not())

        harness.session.followDeviceLanguage()
        assertEquals("Język", (harness.session.screen() as Screen.Settings).title)
        assertTrue(
            ((harness.session.screen() as Screen.Settings).page as SettingsPage.Language).catalog.device.selected,
        )

        harness.deviceTagsList[0] = "de"
        harness.session.syncLanguage(LanguagePreference.Device)
        assertEquals("Sprache", (harness.session.screen() as Screen.Settings).title)

        harness.session.setLanguage(LanguageId.En)
        harness.deviceTagsList[0] = "fr"
        harness.session.syncLanguage(LanguagePreference.Fixed(LanguageId.En))
        assertEquals("Language", (harness.session.screen() as Screen.Settings).title)
    }

    @Test
    fun unknownDeviceLanguageSuggestsEnglishOnly() {
        val harness = Harness(mutableListOf("ar"))
        val gate = harness.session.screen() as Screen.ChooseRealm
        assertEquals("Выберите Реалм", gate.title)
        assertEquals("Оценка", gate.headline)
        assertEquals("Номинальная оценка имущества аккаунта World of Tanks.", gate.description)
        harness.session.openSettings()
        harness.session.openLanguageSettings()
        val catalog = ((harness.session.screen() as Screen.Settings).page as SettingsPage.Language).catalog
        assertEquals(
            listOf(LanguageId.En),
            catalog.suggested.map { (it.preference as LanguagePreference.Fixed).id },
        )
        assertTrue(catalog.all.any { (it.preference as LanguagePreference.Fixed).id == LanguageId.Ru })
    }

    @Test
    fun deviceLanguageChangeRecollectsAnOpenValuation() = runBlocking {
        val harness = Harness(mutableListOf("ja"))
        harness.wg.account = AccountSnapshot(silver = 0, gold = 0, bonds = 0, hangarTankIds = listOf(1))
        harness.wg.vehicles = listOf(VehiclePrice(1, priceSilver = 400, priceGold = 0))
        signIn(harness)
        assertEquals(listOf("en"), harness.wg.encyclopediaLanguages)
        harness.deviceTagsList[0] = "de"
        harness.session.syncLanguage(LanguagePreference.Device)
        assertEquals(listOf("en", "de"), harness.wg.encyclopediaLanguages)
        assertEquals("Abmelden", (harness.session.screen() as Screen.Valuation).signOutLabel)
    }
}

private class Harness(val deviceTagsList: MutableList<String> = mutableListOf()) {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Unconfined)
    val clock = FakeClock()
    val tab = FakeTab()
    val wg = FakeWg()
    val session = PlayerSession(
        customTab = tab,
        wgForRealm = { wg },
        clock = clock,
        config = PlayerSessionConfig(
            wgApplicationId = "test-application-id",
            silverPerGold = 400.0,
            goldPerBond = 1.6,
            freeXpPerGold = 25.0,
            goldPacks = Realm.entries.associateWith { GoldPack(50_000.0, 100.0) },
        ),
        deviceTags = { deviceTagsList.toList() },
        systemInDarkTheme = { true },
        scope = scope,
    )
}

private class FakeClock(override var nowUnixSeconds: Long = 1_700_000_000L) : Clock

private class FakeTab : CustomTab {
    val opened = mutableListOf<String>()
    var next: CustomTabResult = CustomTabResult.Dismiss
    override suspend fun open(url: String): CustomTabResult {
        opened += url
        return next
    }

    fun succeed(url: String) {
        next = CustomTabResult.Success(url)
    }
}

private class FakeWg : WgClient {
    val logoutCalls = mutableListOf<String>()
    var prolongateResult: Prolongate = Prolongate.Failed
    var account = AccountSnapshot(silver = 0, gold = 0, bonds = 0)
    var accountError: Exception? = null
    var accountGate = CompletableDeferred<Unit>().also { it.complete(Unit) }
    var vehicles: List<VehiclePrice> = emptyList()
    var vehiclesError: Exception? = null
    var boosterPrices: List<BoosterPrice> = emptyList()
    var clan: String? = null
    var clanError: Exception? = null
    var clanCalls = 0
    val encyclopediaLanguages = mutableListOf<String>()

    override suspend fun logout(accessToken: String) {
        logoutCalls += accessToken
    }

    override suspend fun prolongate(accessToken: String): Prolongate = prolongateResult

    override suspend fun fetchAccount(accessToken: String, accountId: Long): AccountSnapshot {
        accountGate.await()
        accountError?.let { throw it }
        return account
    }

    override suspend fun fetchVehiclePrices(tankIds: List<Long>, language: String): List<VehiclePrice> {
        encyclopediaLanguages += language
        vehiclesError?.let { throw it }
        return vehicles
    }

    override suspend fun fetchBoosterPrices(language: String): List<BoosterPrice> {
        encyclopediaLanguages += language
        return boosterPrices
    }

    override suspend fun fetchClanTag(accountId: Long): String? {
        clanCalls += 1
        clanError?.let { throw it }
        return clan
    }
}

private fun okCallback(
    accessToken: String = "live-token",
    expiresAt: Long = 1_700_000_000L + 14 * 24 * 3600,
    accountId: Long = 42,
    nickname: String = "Player",
): String =
    "wotcost://auth/callback?status=ok&access_token=$accessToken&expires_at=$expiresAt&account_id=$accountId&nickname=$nickname"

private fun errorCallback(message: String): String =
    "wotcost://auth/callback?status=error&code=401&message=$message"

private suspend fun signIn(harness: Harness, realm: Realm = Realm.EU, nickname: String = "Player") {
    harness.tab.succeed(okCallback(nickname = nickname))
    harness.session.chooseRealm(realm)
}

private fun signedIn(account: AccountSnapshot = AccountSnapshot(0, 0, 0)): Harness {
    val harness = Harness()
    harness.wg.account = account
    runBlocking { signIn(harness) }
    return harness
}

private fun PlayerSession.numbers(): ValuationSnapshot.Numbers =
    (screen() as Screen.Valuation).snapshot as ValuationSnapshot.Numbers

private fun assertRow(row: ColumnRow, line: Line, name: String, count: Long, amount: Double) {
    assertEquals(line, row.line)
    assertEquals(name, row.name)
    assertEquals(count, row.count)
    assertEquals(amount, row.amount, 1e-9)
}
