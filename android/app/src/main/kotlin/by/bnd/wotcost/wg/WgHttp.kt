package by.bnd.wotcost.wg

import by.bnd.wotcost.domain.AccountSnapshot
import by.bnd.wotcost.domain.BoosterPrice
import by.bnd.wotcost.domain.OwnedBooster
import by.bnd.wotcost.domain.Prolongate
import by.bnd.wotcost.domain.RentedTank
import by.bnd.wotcost.domain.VehiclePrice
import by.bnd.wotcost.domain.WgClient
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import okhttp3.OkHttpClient
import okhttp3.Request

class OkHttpTransport(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build(),
) {
    fun get(url: String): String {
        val request = Request.Builder().url(url).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("wg-http")
            return response.body?.string() ?: error("wg-http")
        }
    }
}

class HttpWg(
    private val origin: String,
    private val applicationId: String,
    private val http: (String) -> String,
) : WgClient {
    override suspend fun logout(accessToken: String) {
        try {
            getJson("/wot/auth/logout/", mapOf("access_token" to accessToken))
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            // Local sign-out already forgot the token.
        }
    }

    override suspend fun prolongate(accessToken: String): Prolongate {
        return try {
            val body = getJson("/wot/auth/prolongate/", mapOf("access_token" to accessToken))
            val data = body["data"] as? JsonObject
            val nextToken = data.string("access_token")
            val expiresAt = data.long("expires_at")
            if (body.status() != "ok" || nextToken == null || expiresAt == null) {
                Prolongate.Failed
            } else {
                Prolongate.Ok(nextToken, expiresAt)
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            Prolongate.Failed
        }
    }

    override suspend fun fetchAccount(accessToken: String, accountId: Long): AccountSnapshot {
        val body = getJson(
            "/wot/account/info/",
            mapOf(
                "access_token" to accessToken,
                "account_id" to accountId.toString(),
                "extra" to "private.garage,private.rented,private.boosters",
            ),
        )
        val accounts = body["data"] as? JsonObject
        val account = accounts?.get(accountId.toString()) as? JsonObject
        val privateBlock = account?.get("private") as? JsonObject
        if (body.status() != "ok" || privateBlock == null) error("account")
        val hangar = (privateBlock["garage"] as? JsonArray).orEmpty().mapNotNull { it.asLong() }
        return AccountSnapshot(
            silver = privateBlock.long("credits") ?: 0,
            gold = privateBlock.long("gold") ?: 0,
            bonds = privateBlock.long("bonds") ?: 0,
            freeXp = privateBlock.long("free_xp") ?: 0,
            premiumExpiresAt = privateBlock.long("premium_expires_at"),
            hangarTankIds = hangar,
            rented = parseRented(privateBlock["rented"]),
            boosters = parseBoosters(privateBlock["boosters"]),
        )
    }

    override suspend fun fetchVehiclePrices(
        tankIds: List<Long>,
        language: String,
    ): List<VehiclePrice> {
        val prices = mutableListOf<VehiclePrice>()
        var index = 0
        while (index < tankIds.size) {
            val chunk = tankIds.subList(index, minOf(index + 100, tankIds.size))
            val body = getJson(
                "/wot/encyclopedia/vehicles/",
                mapOf(
                    "tank_id" to chunk.joinToString(","),
                    "language" to language,
                    "fields" to "tank_id,price_credit,price_gold,tier,is_premium,is_gift",
                ),
            )
            val data = body["data"] as? JsonObject
            if (body.status() != "ok" || data == null) error("vehicles")
            for (vehicle in data.values) {
                val record = vehicle as? JsonObject ?: continue
                val tankId = record.long("tank_id") ?: continue
                prices += VehiclePrice(
                    tankId = tankId,
                    priceSilver = record.long("price_credit"),
                    priceGold = record.long("price_gold"),
                    tier = record.long("tier"),
                    isPremium = record.bool("is_premium"),
                    isGift = record.bool("is_gift"),
                )
            }
            index += 100
        }
        return prices
    }

    override suspend fun fetchBoosterPrices(language: String): List<BoosterPrice> {
        val body = getJson(
            "/wot/encyclopedia/boosters/",
            mapOf(
                "language" to language,
                "fields" to "booster_id,price_gold,resource,lifetime,description",
            ),
        )
        val data = body["data"] as? JsonObject
        if (body.status() != "ok" || data == null) error("boosters")
        return data.values.mapNotNull { booster ->
            val record = booster as? JsonObject ?: return@mapNotNull null
            val boosterId = record.long("booster_id") ?: return@mapNotNull null
            BoosterPrice(
                boosterId = boosterId,
                priceGold = record.long("price_gold"),
                resource = record.string("resource"),
                lifetime = record.long("lifetime"),
                description = record.string("description"),
            )
        }
    }

    override suspend fun fetchClanTag(accountId: Long): String? {
        val body = getJson(
            "/wot/clans/accountinfo/",
            mapOf(
                "account_id" to accountId.toString(),
                "fields" to "clan.tag",
            ),
        )
        val accounts = body["data"] as? JsonObject
        if (body.status() != "ok" || accounts == null) error("clan")
        val row = accounts[accountId.toString()]
        if (row == null || row is JsonNull) return null
        val record = row as? JsonObject ?: return null
        val clan = record["clan"] as? JsonObject ?: return null
        val tag = clan["tag"] as? JsonPrimitive ?: return null
        if (tag is JsonNull || !tag.isString) return null
        return tag.content.takeIf { it.isNotEmpty() }
    }

    private suspend fun getJson(path: String, params: Map<String, String>): JsonObject =
        withContext(Dispatchers.IO) {
            val url = buildString {
                append(origin.trimEnd('/'))
                append(path)
                append("?application_id=")
                append(encode(applicationId))
                for ((key, value) in params) {
                    append('&')
                    append(encode(key))
                    append('=')
                    append(encode(value))
                }
            }
            val element = kotlinx.serialization.json.Json.parseToJsonElement(http(url))
            element as? JsonObject ?: error("wg-http")
        }
}

private fun encode(value: String): String =
    URLEncoder.encode(value, StandardCharsets.UTF_8)

private fun JsonObject.status(): String? = this["status"].asPrimitive()?.contentOrNull

private fun JsonObject?.long(key: String): Long? = this?.get(key).asLong()

private fun JsonObject?.string(key: String): String? {
    val primitive = this?.get(key).asPrimitive() ?: return null
    if (primitive is JsonNull || !primitive.isString) return null
    return primitive.content
}

private fun JsonObject?.bool(key: String): Boolean {
    val primitive = this?.get(key).asPrimitive() ?: return false
    return primitive.booleanOrNull == true
}

private fun JsonElement?.asPrimitive(): JsonPrimitive? = this as? JsonPrimitive

private fun JsonElement?.asLong(): Long? {
    if (this == null || this is JsonNull) return null
    val primitive = this as? JsonPrimitive ?: return null
    primitive.longOrNull?.let { return it }
    val number = primitive.doubleOrNull ?: primitive.content.toDoubleOrNull() ?: return null
    if (!number.isFinite()) return null
    return number.toLong()
}

private val boosterShapeKeys = setOf("count", "expiration_time", "state")

private fun parseRented(raw: JsonElement?): List<RentedTank> {
    if (raw == null || raw is JsonNull) return emptyList()
    val rows: List<JsonElement> = when (raw) {
        is JsonArray -> raw
        is JsonObject -> raw.values.toList()
        else -> listOf(raw)
    }
    return rows.mapNotNull { row ->
        val record = row as? JsonObject ?: return@mapNotNull null
        val tankId = record.long("tank_id") ?: return@mapNotNull null
        RentedTank(
            tankId = tankId,
            compensationSilver = record.long("compensation_credits") ?: 0,
            compensationGold = record.long("compensation_gold") ?: 0,
        )
    }
}

private fun parseBoosters(raw: JsonElement?): List<OwnedBooster> {
    val record = raw as? JsonObject ?: return emptyList()
    if (record.keys.isNotEmpty() && record.keys.all { it in boosterShapeKeys }) return emptyList()
    return record.mapNotNull { (key, row) ->
        val item = row as? JsonObject ?: return@mapNotNull null
        val boosterId = item.long("booster_id") ?: key.toLongOrNull() ?: return@mapNotNull null
        OwnedBooster(
            boosterId = boosterId,
            count = item.long("count") ?: 0,
            state = item.string("state") ?: "",
        )
    }.sortedBy { it.boosterId }
}
