package by.bnd.wotcost.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.translate
import by.bnd.wotcost.domain.Realm
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

private data class Cover(val left: Float, val top: Float, val width: Float, val height: Float)

private fun coverBox(boxW: Float, boxH: Float, ratio: Float): Cover {
    if (boxW / boxH > ratio) {
        val height = boxW / ratio
        return Cover(0f, (boxH - height) / 2f, boxW, height)
    }
    val width = boxH * ratio
    return Cover((boxW - width) / 2f, 0f, width, boxH)
}

@Composable
fun RealmFlag(realm: Realm, modifier: Modifier = Modifier) {
    Canvas(modifier.fillMaxSize()) {
        val ratio = if (realm == Realm.NA) 1.9f else 1.5f
        val art = coverBox(size.width, size.height, ratio)
        translate(art.left, art.top) {
            when (realm) {
                Realm.NA -> naFlag(art.width, art.height)
                Realm.EU -> euFlag(art.width, art.height)
                Realm.ASIA -> asiaFlag(art.width, art.height)
            }
        }
    }
}

private fun DrawScope.naFlag(width: Float, height: Float) {
    val stripe = height / 13f
    repeat(13) { index ->
        drawRect(
            color = if (index % 2 == 0) Color(0xFFB22234) else Color.White,
            topLeft = Offset(0f, stripe * index),
            size = Size(width, stripe),
        )
    }
    val cantonW = width * 0.4f
    val cantonH = height * (7f / 13f)
    drawRect(Color(0xFF3C3B6E), size = Size(cantonW, cantonH))
    val star = min(cantonW / 14f, cantonH / 12f)
    val rows = listOf(6, 5, 6, 5, 6, 5, 6, 5, 6)
    rows.forEachIndexed { row, count ->
        repeat(count) { col ->
            val x = if (count == 6) {
                ((col + 0.5f) * cantonW) / 6f
            } else {
                ((col + 1f) * cantonW) / 6f
            }
            val y = ((row + 0.5f) * cantonH) / 9f
            drawStar(x, y, star / 2f, Color.White)
        }
    }
}

private fun DrawScope.euFlag(width: Float, height: Float) {
    drawRect(Color(0xFF003399), size = Size(width, height))
    val radius = min(width, height) * 0.3f
    val star = min(width, height) * 0.05f
    repeat(12) { index ->
        val angle = -Math.PI / 2.0 + (index * 2.0 * Math.PI) / 12.0
        drawStar(
            cx = width / 2f + (radius * cos(angle)).toFloat(),
            cy = height / 2f + (radius * sin(angle)).toFloat(),
            outer = star,
            color = Color(0xFFFFCC00),
        )
    }
}

private fun DrawScope.asiaFlag(width: Float, height: Float) {
    drawRect(Color(0xFFDE2910), size = Size(width, height))
    val bigX = width * (5f / 30f)
    val bigY = height * (5f / 20f)
    drawStar(bigX, bigY, height * 0.15f, Color(0xFFFFDE00))
    val small = listOf(
        width * (10f / 30f) to height * (2f / 20f),
        width * (12f / 30f) to height * (4f / 20f),
        width * (12f / 30f) to height * (7f / 20f),
        width * (10f / 30f) to height * (9f / 20f),
    )
    val smallSize = height * 0.05f
    for ((x, y) in small) {
        val rotation = Math.toDegrees(kotlin.math.atan2((bigY - y).toDouble(), (bigX - x).toDouble())).toFloat() + 90f
        drawStar(x, y, smallSize, Color(0xFFFFDE00), rotation)
    }
}

private fun DrawScope.drawStar(
    cx: Float,
    cy: Float,
    outer: Float,
    color: Color,
    rotationDeg: Float = 0f,
) {
    val inner = outer * 0.4f
    val path = Path()
    for (index in 0 until 10) {
        val radius = if (index % 2 == 0) outer else inner
        val angle = Math.toRadians(rotationDeg.toDouble() - 90.0 + index * 36.0)
        val x = cx + (radius * cos(angle)).toFloat()
        val y = cy + (radius * sin(angle)).toFloat()
        if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    path.close()
    drawPath(path, color)
}
