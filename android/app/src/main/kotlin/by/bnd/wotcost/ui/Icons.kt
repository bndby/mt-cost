package by.bnd.wotcost.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

val TankIcon: ImageVector = ImageVector.Builder(
    name = "Tank",
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f,
).apply {
    path(fill = SolidColor(Color.Black)) {
        moveTo(1.5f, 16.2f)
        lineTo(22.5f, 16.2f)
        lineTo(22.5f, 19.4f)
        lineTo(1.5f, 19.4f)
        close()
        moveTo(3.2f, 12.2f)
        lineTo(15.6f, 12.2f)
        lineTo(17.4f, 16.2f)
        lineTo(2.2f, 16.2f)
        close()
        moveTo(7.2f, 8.2f)
        lineTo(12.6f, 8.2f)
        lineTo(12.6f, 12.2f)
        lineTo(7.2f, 12.2f)
        close()
        moveTo(12.6f, 9.4f)
        lineTo(21.2f, 9.4f)
        lineTo(21.2f, 11.1f)
        lineTo(12.6f, 11.1f)
        close()
    }
}.build()
