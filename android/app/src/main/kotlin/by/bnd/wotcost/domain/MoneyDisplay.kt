package by.bnd.wotcost.domain

import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs
import kotlin.math.round

fun splitMoneyDisplay(amount: Double): Pair<String, String> {
    val totalMinor = round(amount * 100.0).toLong()
    val sign = if (totalMinor < 0) "-" else ""
    val absolute = abs(totalMinor)
    val integer = absolute / 100
    val minor = (absolute % 100).toString().padStart(2, '0')
    val grouped = NumberFormat.getIntegerInstance(Locale.forLanguageTag("ru-RU")).format(integer)
    return "$sign$grouped" to minor
}

fun formatCount(value: Long): String =
    NumberFormat.getIntegerInstance(Locale.forLanguageTag("ru-RU")).format(value)
