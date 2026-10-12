package by.bnd.wotcost.domain

const val OPEN_ID_REDIRECT_URI = "https://bndby.github.io/mt-cost/auth/callback"
const val CUSTOM_SCHEME_CALLBACK = "wotcost://auth/callback"

enum class Realm(val origin: String, val symbol: String) {
    NA("https://api.worldoftanks.com", "$"),
    EU("https://api.worldoftanks.eu", "€"),
    ASIA("https://api.worldoftanks.asia", "¥"),
}

enum class Line {
    Bonds,
    Gold,
    Silver,
    FreeXp,
    Boosters,
    PremiumAccount,
    Premium,
    Researchable,
}

data class ColumnRow(
    val line: Line,
    val name: String,
    val count: Long,
    val amount: Double,
)

sealed interface ValuationSnapshot {
    data object Waiting : ValuationSnapshot
    data object Dashes : ValuationSnapshot
    data class Numbers(val heroAmount: Double, val rows: List<ColumnRow>) : ValuationSnapshot
}

data class RealmChoice(val key: Realm, val name: String, val selected: Boolean)

enum class ThemePreference {
    System,
    Light,
    Dark,
}

sealed interface LanguagePreference {
    data object Device : LanguagePreference
    data class Fixed(val id: LanguageId) : LanguagePreference
}

data class ThemeOption(
    val preference: ThemePreference,
    val label: String,
    val subtitle: String?,
    val selected: Boolean,
)

data class LanguageOptionRow(
    val preference: LanguagePreference,
    val title: String,
    val subtitle: String?,
    val selected: Boolean,
)

data class SettingsRoot(
    val themeLabel: String,
    val themeValue: String,
    val languageLabel: String,
    val languageValue: String,
)

data class LanguageCatalog(
    val device: LanguageOptionRow,
    val suggestedTitle: String,
    val suggested: List<LanguageOptionRow>,
    val allTitle: String,
    val all: List<LanguageOptionRow>,
)

sealed interface SettingsPage {
    data class Root(val body: SettingsRoot) : SettingsPage
    data class Theme(val options: List<ThemeOption>) : SettingsPage
    data class Language(val catalog: LanguageCatalog) : SettingsPage
}

sealed interface Screen {
    data class ChooseRealm(
        val title: String,
        val headline: String,
        val description: String,
        val settingsLabel: String,
        val realms: List<RealmChoice>,
    ) : Screen

    data class Valuation(
        val signOutLabel: String,
        val retryLabel: String?,
        val settingsLabel: String,
        val kicker: String,
        val symbol: String,
        val snapshot: ValuationSnapshot,
    ) : Screen

    data class Settings(
        val title: String,
        val backLabel: String,
        val page: SettingsPage,
    ) : Screen
}

sealed interface CustomTabResult {
    data class Success(val url: String) : CustomTabResult
    data object Dismiss : CustomTabResult
}

fun interface CustomTab {
    suspend fun open(url: String): CustomTabResult
}

interface Clock {
    val nowUnixSeconds: Long
}

data class RentedTank(
    val tankId: Long,
    val compensationSilver: Long,
    val compensationGold: Long,
)

data class OwnedBooster(
    val boosterId: Long,
    val count: Long,
    val state: String,
)

data class AccountSnapshot(
    val silver: Long,
    val gold: Long,
    val bonds: Long,
    val freeXp: Long = 0,
    val premiumExpiresAt: Long? = null,
    val hangarTankIds: List<Long> = emptyList(),
    val rented: List<RentedTank> = emptyList(),
    val boosters: List<OwnedBooster> = emptyList(),
)

data class VehiclePrice(
    val tankId: Long,
    val priceSilver: Long?,
    val priceGold: Long?,
    val tier: Long? = null,
    val isPremium: Boolean = false,
    val isGift: Boolean = false,
)

data class BoosterPrice(
    val boosterId: Long,
    val priceGold: Long?,
    val resource: String? = null,
    val lifetime: Long? = null,
    val description: String? = null,
)

sealed interface Prolongate {
    data class Ok(val accessToken: String, val expiresAt: Long) : Prolongate
    data object Failed : Prolongate
}

interface WgClient {
    suspend fun logout(accessToken: String)
    suspend fun prolongate(accessToken: String): Prolongate
    suspend fun fetchAccount(accessToken: String, accountId: Long): AccountSnapshot
    suspend fun fetchVehiclePrices(tankIds: List<Long>, language: String = "en"): List<VehiclePrice>
    suspend fun fetchBoosterPrices(language: String = "en"): List<BoosterPrice>
    suspend fun fetchClanTag(accountId: Long): String?
}

data class GoldPack(val gold: Double, val money: Double)

data class PlayerSessionConfig(
    val wgApplicationId: String,
    val silverPerGold: Double,
    val goldPerBond: Double,
    val freeXpPerGold: Double,
    val goldPacks: Map<Realm, GoldPack>,
)
