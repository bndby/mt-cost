package by.bnd.wotcost.ui

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import by.bnd.wotcost.domain.ThemePreference

private val NeutralLight = lightColorScheme(
    primary = Color(0xFF44474E),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFDDE1E8),
    onPrimaryContainer = Color(0xFF1A1C1F),
    secondary = Color(0xFF5C5F66),
    onSecondary = Color(0xFFFFFFFF),
    surface = Color(0xFFF7F7F8),
    onSurface = Color(0xFF1B1C1E),
    onSurfaceVariant = Color(0xFF45474C),
    outline = Color(0xFF75777C),
    background = Color(0xFFF7F7F8),
    onBackground = Color(0xFF1B1C1E),
    surfaceContainer = Color(0xFFEEEEF0),
    surfaceContainerHigh = Color(0xFFE6E6E9),
    surfaceContainerHighest = Color(0xFFDCDDE0),
)

private val NeutralDark = darkColorScheme(
    primary = Color(0xFFC4C6CF),
    onPrimary = Color(0xFF1B1C1E),
    primaryContainer = Color(0xFF44474E),
    onPrimaryContainer = Color(0xFFE3E2E6),
    secondary = Color(0xFFC4C6CF),
    onSecondary = Color(0xFF1B1C1E),
    surface = Color(0xFF111113),
    onSurface = Color(0xFFE4E2E6),
    onSurfaceVariant = Color(0xFFC4C6CF),
    outline = Color(0xFF8E9099),
    background = Color(0xFF111113),
    onBackground = Color(0xFFE4E2E6),
    surfaceContainer = Color(0xFF1E1F22),
    surfaceContainerHigh = Color(0xFF282A2D),
    surfaceContainerHighest = Color(0xFF33353A),
)

fun ThemePreference.resolvesDark(systemDark: Boolean): Boolean = when (this) {
    ThemePreference.Dark -> true
    ThemePreference.Light -> false
    ThemePreference.System -> systemDark
}

@Composable
fun WotCostTheme(
    preference: ThemePreference,
    content: @Composable () -> Unit,
) {
    val dark = preference.resolvesDark(isSystemInDarkTheme())
    val context = LocalContext.current
    val colorScheme = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && dark -> dynamicDarkColorScheme(context)
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !dark -> dynamicLightColorScheme(context)
        dark -> NeutralDark
        else -> NeutralLight
    }
    MaterialTheme(colorScheme = colorScheme, content = content)
}
