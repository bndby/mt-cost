package by.bnd.wotcost.domain

import kotlin.math.ceil
import kotlin.math.floor

data class ValuationRates(
    val silverPerGold: Double,
    val goldPerBond: Double,
    val freeXpPerGold: Double,
    val goldPackGold: Double,
    val goldPackMoney: Double,
    val premiumPackages: List<PremiumPackage>,
)

data class PremiumPackage(val days: Int, val gold: Int)

val WG_PREMIUM_PACKAGES = listOf(
    PremiumPackage(360, 20_500),
    PremiumPackage(180, 11_900),
    PremiumPackage(90, 6_900),
    PremiumPackage(30, 2_500),
    PremiumPackage(14, 1_800),
    PremiumPackage(7, 1_250),
    PremiumPackage(3, 650),
    PremiumPackage(1, 250),
)

private fun moneyFromGold(gold: Double, rates: ValuationRates): Double =
    (gold * rates.goldPackMoney) / rates.goldPackGold

private fun premiumAccountValue(
    premiumExpiresAt: Long?,
    nowUnixSeconds: Long,
    packages: List<PremiumPackage>,
): Pair<Int, Int> {
    if (premiumExpiresAt == null || premiumExpiresAt <= nowUnixSeconds) {
        return 0 to 0
    }
    val span = (premiumExpiresAt - nowUnixSeconds).toDouble()
    var days = ceil(span / 86_400.0).toInt()
    var gold = 0
    for (pack in packages) {
        val count = floor(days.toDouble() / pack.days).toInt()
        days -= count * pack.days
        gold += count * pack.gold
    }
    val totalDays = ceil(span / 86_400.0).toInt()
    return totalDays to gold
}

fun uniqueTankIds(hangarTankIds: List<Long>, rented: List<RentedTank>): List<Long> =
    (hangarTankIds + rented.map { it.tankId }).distinct()

private fun pushRow(
    rows: MutableList<ColumnRow>,
    line: Line,
    name: String,
    count: Long,
    amount: Double,
) {
    if (count > 0) rows += ColumnRow(line, name, count, amount)
}

private fun boosterUnitGold(owned: OwnedBooster, catalog: Map<Long, BoosterPrice>): Int {
    if (owned.state == "USED" || owned.count <= 0) return 0
    val apiGold = catalog[owned.boosterId]?.priceGold ?: 0
    return if (apiGold > 0) apiGold.toInt() else 0
}

private fun tankGoldAndSilver(price: VehiclePrice?): Pair<Long, Long> {
    val catalogGold = price?.priceGold ?: 0
    val catalogSilver = price?.priceSilver ?: 0
    if (catalogGold > 0) return catalogGold to 0
    if (catalogSilver > 0) return 0L to catalogSilver
    return 0L to 0L
}

fun valueAccount(
    account: AccountSnapshot,
    tankIds: List<Long>,
    prices: List<VehiclePrice>,
    boosterPrices: List<BoosterPrice>,
    rates: ValuationRates,
    nowUnixSeconds: Long,
    names: RowNames,
): Pair<Double, List<ColumnRow>> {
    val priceById = prices.associateBy { it.tankId }
    val boosterById = boosterPrices.associateBy { it.boosterId }
    var premiumCount = 0L
    var premiumGold = 0L
    var researchableCount = 0L
    var researchableSilver = 0L
    val (premiumDays, premiumGoldCost) = premiumAccountValue(
        account.premiumExpiresAt,
        nowUnixSeconds,
        rates.premiumPackages,
    )
    for (tankId in tankIds) {
        val (gold, silver) = tankGoldAndSilver(priceById[tankId])
        if (gold > 0) {
            premiumCount += 1
            premiumGold += gold
        } else if (silver > 0) {
            researchableCount += 1
            researchableSilver += silver
        }
    }

    var boosterCount = 0L
    var boosterGold = 0L
    for (owned in account.boosters) {
        val unit = boosterUnitGold(owned, boosterById)
        if (unit <= 0) continue
        boosterCount += owned.count
        boosterGold += unit * owned.count
    }

    val rows = mutableListOf<ColumnRow>()
    pushRow(rows, Line.Bonds, names.bonds, account.bonds, moneyFromGold(account.bonds * rates.goldPerBond, rates))
    pushRow(rows, Line.Gold, names.gold, account.gold, moneyFromGold(account.gold.toDouble(), rates))
    pushRow(
        rows,
        Line.Silver,
        names.silver,
        account.silver,
        moneyFromGold(account.silver / rates.silverPerGold, rates),
    )
    pushRow(
        rows,
        Line.FreeXp,
        names.freeXp,
        account.freeXp,
        moneyFromGold(account.freeXp / rates.freeXpPerGold, rates),
    )
    pushRow(rows, Line.Boosters, names.boosters, boosterCount, moneyFromGold(boosterGold.toDouble(), rates))
    pushRow(
        rows,
        Line.PremiumAccount,
        names.premiumAccount,
        premiumDays.toLong(),
        moneyFromGold(premiumGoldCost.toDouble(), rates),
    )
    pushRow(rows, Line.Premium, names.premium, premiumCount, moneyFromGold(premiumGold.toDouble(), rates))
    pushRow(
        rows,
        Line.Researchable,
        names.researchable,
        researchableCount,
        moneyFromGold(researchableSilver / rates.silverPerGold, rates),
    )
    return rows.sumOf { it.amount } to rows
}
