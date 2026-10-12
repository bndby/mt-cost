package by.bnd.wotcost.ui

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import by.bnd.wotcost.domain.ColumnRow
import by.bnd.wotcost.domain.LanguageOptionRow
import by.bnd.wotcost.domain.LanguagePreference
import by.bnd.wotcost.domain.Line
import by.bnd.wotcost.domain.Realm
import by.bnd.wotcost.domain.Screen
import by.bnd.wotcost.domain.SettingsPage
import by.bnd.wotcost.domain.ThemeOption
import by.bnd.wotcost.domain.ThemePreference
import by.bnd.wotcost.domain.ValuationSnapshot
import by.bnd.wotcost.domain.formatCount
import by.bnd.wotcost.domain.splitMoneyDisplay

private val Bonds = Color(0xFFC17A3A)
private val GoldMetal = Color(0xFFC4A035)
private val SilverMetal = Color(0xFF8B95A1)

@Composable
fun PlayerScreen(
    screen: Screen,
    onChooseRealm: (Realm) -> Unit,
    onSignOut: () -> Unit,
    onRetry: () -> Unit,
    onOpenSettings: () -> Unit,
    onCloseSettings: () -> Unit,
    onOpenTheme: () -> Unit,
    onOpenLanguage: () -> Unit,
    onChooseTheme: (ThemePreference) -> Unit,
    onChooseLanguage: (LanguagePreference) -> Unit,
) {
    when (screen) {
        is Screen.ChooseRealm -> ChooseRealm(screen, onChooseRealm, onOpenSettings)
        is Screen.Settings -> Settings(
            screen,
            onCloseSettings,
            onOpenTheme,
            onOpenLanguage,
            onChooseTheme,
            onChooseLanguage,
        )
        is Screen.Valuation -> Valuation(screen, onSignOut, onRetry, onOpenSettings)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChooseRealm(
    screen: Screen.ChooseRealm,
    onChooseRealm: (Realm) -> Unit,
    onOpenSettings: () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = screen.settingsLabel)
                    }
                },
            )
        },
    ) { padding ->
        BoxWithConstraints(
            Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            val viewport = maxHeight
            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
            ) {
                RealmGate(
                    viewport = viewport,
                    screen = screen,
                    onChooseRealm = onChooseRealm,
                )
            }
        }
    }
}

@Composable
private fun RealmGate(
    viewport: Dp,
    screen: Screen.ChooseRealm,
    onChooseRealm: (Realm) -> Unit,
) {
    Layout(
        content = {
            TankSilhouette()
            Column(Modifier.fillMaxWidth()) {
                Text(
                    screen.headline,
                    style = MaterialTheme.typography.headlineLarge,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                Text(
                    screen.description,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 4.dp),
                )
                SectionTitle(screen.title)
                Column(Modifier.selectableGroup()) {
                    screen.realms.forEach { realm ->
                        ListItem(
                            headlineContent = {
                                Text(realm.key.name, style = MaterialTheme.typography.titleLarge)
                            },
                            supportingContent = { Text(realm.name) },
                            leadingContent = {
                                RealmFlag(
                                    realm.key,
                                    Modifier.size(width = 48.dp, height = 32.dp),
                                )
                            },
                            trailingContent = {
                                RadioButton(selected = realm.selected, onClick = null)
                            },
                            modifier = Modifier.clickable(role = Role.RadioButton) {
                                onChooseRealm(realm.key)
                            },
                        )
                    }
                }
            }
        },
    ) { measurables, constraints ->
        val bottom = measurables[1].measure(
            constraints.copy(minWidth = constraints.maxWidth, minHeight = 0, maxHeight = Constraints.Infinity),
        )
        val space = (viewport.roundToPx() - bottom.height).coerceAtLeast(0)
        val maxGraphicHeight = minOf(220.dp.roundToPx(), space)
        val maxGraphicWidth = (constraints.maxWidth - 32.dp.roundToPx() * 2).coerceAtLeast(0)
        var graphicWidth = maxGraphicWidth
        var graphicHeight = (graphicWidth / TankSilhouetteAspect).toInt()
        if (graphicHeight > maxGraphicHeight) {
            graphicHeight = maxGraphicHeight
            graphicWidth = (graphicHeight * TankSilhouetteAspect).toInt().coerceAtMost(maxGraphicWidth)
        }
        val graphic = measurables[0].measure(
            Constraints.fixed(graphicWidth.coerceAtLeast(0), graphicHeight.coerceAtLeast(0)),
        )
        val height = maxOf(viewport.roundToPx(), bottom.height)
        layout(constraints.maxWidth, height) {
            graphic.place(
                x = (constraints.maxWidth - graphic.width) / 2,
                y = ((space - graphic.height) / 2).coerceAtLeast(0),
            )
            bottom.place(0, space)
        }
    }
}

@Composable
private fun Settings(
    screen: Screen.Settings,
    onCloseSettings: () -> Unit,
    onOpenTheme: () -> Unit,
    onOpenLanguage: () -> Unit,
    onChooseTheme: (ThemePreference) -> Unit,
    onChooseLanguage: (LanguagePreference) -> Unit,
) {
    SettingsScaffold(screen.title, screen.backLabel, onCloseSettings) { padding ->
        when (val page = screen.page) {
            is SettingsPage.Root -> SettingsRoot(page.body, padding, onOpenTheme, onOpenLanguage)
            is SettingsPage.Theme -> ThemeList(page.options, padding, onChooseTheme)
            is SettingsPage.Language -> LanguageList(page.catalog, padding, onChooseLanguage)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsScaffold(
    title: String,
    backLabel: String,
    onBack: () -> Unit,
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = backLabel)
                    }
                },
            )
        },
        content = content,
    )
}

@Composable
private fun SettingsRoot(
    body: by.bnd.wotcost.domain.SettingsRoot,
    padding: PaddingValues,
    onOpenTheme: () -> Unit,
    onOpenLanguage: () -> Unit,
) {
    Column(Modifier.fillMaxSize().padding(padding)) {
        ListItem(
            headlineContent = { Text(body.themeLabel) },
            supportingContent = { Text(body.themeValue) },
            trailingContent = {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
            },
            modifier = Modifier.clickable(onClick = onOpenTheme),
        )
        ListItem(
            headlineContent = { Text(body.languageLabel) },
            supportingContent = { Text(body.languageValue) },
            trailingContent = {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
            },
            modifier = Modifier.clickable(onClick = onOpenLanguage),
        )
    }
}

@Composable
private fun ThemeList(
    options: List<ThemeOption>,
    padding: PaddingValues,
    onChooseTheme: (ThemePreference) -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(padding)
            .selectableGroup(),
    ) {
        options.forEach { option ->
            RadioRow(
                title = option.label,
                subtitle = option.subtitle,
                selected = option.selected,
                onClick = { onChooseTheme(option.preference) },
            )
        }
    }
}

@Composable
private fun LanguageList(
    catalog: by.bnd.wotcost.domain.LanguageCatalog,
    padding: PaddingValues,
    onChooseLanguage: (LanguagePreference) -> Unit,
) {
    LazyColumn(
        Modifier.fillMaxSize().selectableGroup(),
        contentPadding = padding,
    ) {
        item {
            RadioRow(
                title = catalog.device.title,
                subtitle = catalog.device.subtitle,
                selected = catalog.device.selected,
                onClick = { onChooseLanguage(catalog.device.preference) },
            )
        }
        item { SectionTitle(catalog.suggestedTitle) }
        items(catalog.suggested.size) { index ->
            val row = catalog.suggested[index]
            LanguageRadio(row, onChooseLanguage)
        }
        item { SectionTitle(catalog.allTitle) }
        items(catalog.all.size) { index ->
            val row = catalog.all[index]
            LanguageRadio(row, onChooseLanguage)
        }
    }
}

@Composable
private fun LanguageRadio(
    row: LanguageOptionRow,
    onChooseLanguage: (LanguagePreference) -> Unit,
) {
    RadioRow(
        title = row.title,
        subtitle = row.subtitle,
        selected = row.selected,
        onClick = { onChooseLanguage(row.preference) },
    )
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
    )
}

@Composable
private fun RadioRow(
    title: String,
    subtitle: String?,
    selected: Boolean,
    onClick: () -> Unit,
) {
    ListItem(
        headlineContent = { Text(title) },
        supportingContent = if (subtitle == null) {
            null
        } else {
            { Text(subtitle) }
        },
        trailingContent = { RadioButton(selected = selected, onClick = null) },
        modifier = Modifier.clickable(role = Role.RadioButton, onClick = onClick),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Valuation(
    screen: Screen.Valuation,
    onSignOut: () -> Unit,
    onRetry: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val snapshot = screen.snapshot
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(screen.kicker, maxLines = 1, overflow = TextOverflow.Ellipsis)
                },
                actions = {
                    if (snapshot is ValuationSnapshot.Numbers && screen.retryLabel != null) {
                        IconButton(onClick = onRetry) {
                            Icon(Icons.Filled.Refresh, contentDescription = screen.retryLabel)
                        }
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = screen.settingsLabel)
                    }
                    TextButton(onClick = onSignOut) { Text(screen.signOutLabel) }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 24.dp),
        ) {
            when (snapshot) {
                ValuationSnapshot.Waiting -> WaitingPulse(
                    Modifier
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .height(48.dp)
                        .width(220.dp),
                )
                ValuationSnapshot.Dashes -> {
                    Text(
                        "—",
                        style = MaterialTheme.typography.displaySmall,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                    if (screen.retryLabel != null) {
                        Button(
                            onClick = onRetry,
                            modifier = Modifier.padding(horizontal = 16.dp),
                        ) {
                            Text(screen.retryLabel)
                        }
                    }
                }
                is ValuationSnapshot.Numbers -> {
                    MoneyAmount(
                        amount = snapshot.heroAmount,
                        symbol = screen.symbol,
                        fontSize = MaterialTheme.typography.displaySmall.fontSize,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Normal,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                    snapshot.rows.forEach { row ->
                        ColumnLine(row, screen.symbol)
                    }
                }
            }
        }
    }
}

@Composable
private fun ColumnLine(row: ColumnRow, symbol: String) {
    val glyph = glyph(row.line)
    ListItem(
        headlineContent = { Text(row.name) },
        supportingContent = { Text(formatCount(row.count)) },
        leadingContent = {
            Icon(glyph.icon, contentDescription = null, tint = glyph.color)
        },
        trailingContent = {
            MoneyAmount(
                amount = row.amount,
                symbol = symbol,
                fontSize = MaterialTheme.typography.bodyLarge.fontSize,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Medium,
            )
        },
    )
}

private data class Glyph(val icon: ImageVector, val color: Color)

private fun glyph(line: Line): Glyph = when (line) {
    Line.Bonds -> Glyph(Icons.Filled.Payments, Bonds)
    Line.Gold -> Glyph(Icons.Filled.Circle, GoldMetal)
    Line.Silver -> Glyph(Icons.Filled.Circle, SilverMetal)
    Line.FreeXp -> Glyph(Icons.Filled.AutoAwesome, SilverMetal)
    Line.Boosters -> Glyph(Icons.Filled.Bolt, GoldMetal)
    Line.PremiumAccount -> Glyph(Icons.Filled.Schedule, GoldMetal)
    Line.Premium -> Glyph(TankIcon, GoldMetal)
    Line.Researchable -> Glyph(TankIcon, SilverMetal)
}

@Composable
private fun MoneyAmount(
    amount: Double,
    symbol: String,
    fontSize: TextUnit,
    color: Color,
    fontWeight: FontWeight,
    modifier: Modifier = Modifier,
) {
    val (integer, minor) = splitMoneyDisplay(amount)
    Text(
        buildAnnotatedString {
            withStyle(SpanStyle(fontSize = fontSize, fontWeight = fontWeight, color = color)) {
                append(integer)
            }
            withStyle(
                SpanStyle(
                    fontSize = fontSize * 0.7,
                    fontWeight = fontWeight,
                    color = color.copy(alpha = 0.55f),
                ),
            ) {
                append(",$minor")
            }
            withStyle(SpanStyle(fontSize = fontSize, fontWeight = fontWeight, color = color)) {
                append(" $symbol")
            }
        },
        modifier = modifier,
        style = TextStyle(fontFeatureSettings = "tnum"),
    )
}

@Composable
private fun WaitingPulse(modifier: Modifier) {
    val transition = rememberInfiniteTransition()
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(550), RepeatMode.Reverse),
        label = "pulse",
    )
    val shape = MaterialTheme.shapes.extraSmall
    Box(
        modifier
            .clip(shape)
            .background(MaterialTheme.colorScheme.surfaceContainerHighest.copy(alpha = alpha)),
    )
}
