package by.bnd.wotcost.ui

import androidx.compose.foundation.Canvas
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope

const val TankSilhouetteAspect = 2.45f

@Composable
fun TankSilhouette(modifier: Modifier = Modifier) {
    val hull = MaterialTheme.colorScheme.onSurface
    val track = hull.copy(alpha = 0.38f)
    val cutout = MaterialTheme.colorScheme.surface
    Canvas(modifier) {
        if (size.minDimension <= 0f) return@Canvas
        drawTank(hull, track, cutout)
    }
}

private fun DrawScope.drawTank(hull: Color, track: Color, cutout: Color) {
    val w = size.width
    val h = size.height
    fun x(unit: Float) = w * unit
    fun y(unit: Float) = h * unit

    drawRoundRect(
        color = track,
        topLeft = Offset(x(0.04f), y(0.68f)),
        size = Size(x(0.92f), y(0.28f)),
        cornerRadius = CornerRadius(y(0.14f), y(0.14f)),
    )
    val axle = y(0.82f)
    drawCircle(cutout, y(0.095f), Offset(x(0.14f), axle))
    drawCircle(cutout, y(0.095f), Offset(x(0.86f), axle))
    repeat(5) { index ->
        drawCircle(cutout, y(0.075f), Offset(x(0.26f + index * 0.12f), axle))
    }

    val body = Path().apply {
        moveTo(x(0.10f), y(0.70f))
        lineTo(x(0.16f), y(0.46f))
        lineTo(x(0.70f), y(0.46f))
        lineTo(x(0.88f), y(0.64f))
        lineTo(x(0.88f), y(0.70f))
        close()
    }
    drawPath(body, hull)
    drawRoundRect(
        color = hull,
        topLeft = Offset(x(0.36f), y(0.16f)),
        size = Size(x(0.28f), y(0.34f)),
        cornerRadius = CornerRadius(y(0.10f), y(0.10f)),
    )
    drawRoundRect(
        color = hull,
        topLeft = Offset(x(0.44f), y(0.08f)),
        size = Size(x(0.12f), y(0.12f)),
        cornerRadius = CornerRadius(y(0.04f), y(0.04f)),
    )
    drawRoundRect(
        color = hull,
        topLeft = Offset(x(0.58f), y(0.26f)),
        size = Size(x(0.38f), y(0.07f)),
        cornerRadius = CornerRadius(y(0.035f), y(0.035f)),
    )
}
