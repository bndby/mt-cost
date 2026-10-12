package by.bnd.wotcost

import by.bnd.wotcost.wg.HttpWg
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WgHttpTest {
    @Test
    fun accountReadsPrivateFieldsAndSkipsInvalidExtra() = runBlocking {
        val opened = mutableListOf<String>()
        val client = HttpWg("https://api.worldoftanks.eu", "app-id") { url ->
            opened += url
            """
            {"status":"ok","data":{"42":{"private":{
              "credits":400,"gold":20,"bonds":7,"free_xp":25000,
              "premium_expires_at":1700086400,
              "garage":[8],
              "boosters":{
                "121001":{"count":2,"expiration_time":0,"state":"INACTIVE"},
                "9":{"count":1,"expiration_time":0,"state":"USED"}
              }
            }}}}
            """.trimIndent()
        }
        val account = client.fetchAccount("token", 42)
        assertEquals(400L, account.silver)
        assertEquals(20L, account.gold)
        assertEquals(7L, account.bonds)
        assertEquals(25_000L, account.freeXp)
        assertEquals(1_700_086_400L, account.premiumExpiresAt)
        assertEquals(listOf(8L), account.hangarTankIds)
        assertEquals(listOf(9L, 121001L), account.boosters.map { it.boosterId })
        assertEquals(
            "private.garage,private.rented,private.boosters",
            query(opened.single())["extra"],
        )
        assertEquals("app-id", query(opened.single())["application_id"])
        assertEquals("https://api.worldoftanks.eu", opened.single().substringBefore("/wot/"))
    }

    @Test
    fun encyclopediaAndClan() = runBlocking {
        val opened = mutableListOf<String>()
        val client = HttpWg("https://api.worldoftanks.eu", "wg-id") { url ->
            opened += url
            when {
                url.contains("encyclopedia/boosters") ->
                    """{"status":"ok","data":{"121001":{"booster_id":121001,"price_gold":150,"resource":"experience","lifetime":3600,"description":"+100%"}}}"""
                url.contains("encyclopedia/vehicles") ->
                    """{"status":"ok","data":{"8":{"tank_id":8,"price_credit":0,"price_gold":0,"tier":8,"is_premium":false,"is_gift":true}}}"""
                url.contains("account_id=7") -> """{"status":"ok","data":{"7":null}}"""
                else -> """{"status":"ok","data":{"42":{"clan":{"tag":"xYz"}}}}"""
            }
        }
        val prices = client.fetchBoosterPrices()
        assertEquals(121001L, prices.single().boosterId)
        assertEquals(150L, prices.single().priceGold)
        assertEquals("experience", prices.single().resource)
        val vehicles = client.fetchVehiclePrices(listOf(8))
        assertEquals(0L, vehicles.single().priceSilver)
        assertEquals(true, vehicles.single().isGift)
        assertEquals(false, vehicles.single().isPremium)
        assertTrueFields(query(opened[1])["fields"].orEmpty())
        assertEquals("xYz", client.fetchClanTag(42))
        assertNull(client.fetchClanTag(7))
        assertNull(query(opened[2])["access_token"])
    }

    @Test
    fun clanErrorIsThrown() = runBlocking {
        val client = HttpWg("https://api.worldoftanks.eu", "wg-id") {
            """{"status":"error","data":{}}"""
        }
        val error = runCatching { client.fetchClanTag(42) }.exceptionOrNull()
        assertEquals("clan", error?.message)
    }
}

private fun query(url: String): Map<String, String> {
    val raw = url.substringAfter("?", "")
    return raw.split("&").filter { it.isNotEmpty() }.associate {
        val parts = it.split("=", limit = 2)
        java.net.URLDecoder.decode(parts[0], Charsets.UTF_8) to
            java.net.URLDecoder.decode(parts.getOrElse(1) { "" }, Charsets.UTF_8)
    }
}

private fun assertTrueFields(fields: String) {
    org.junit.Assert.assertTrue(fields.contains("tier"))
    org.junit.Assert.assertTrue(fields.contains("is_gift"))
}
