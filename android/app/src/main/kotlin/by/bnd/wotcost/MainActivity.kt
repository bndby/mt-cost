package by.bnd.wotcost

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.activity.compose.BackHandler
import by.bnd.wotcost.auth.AuthBridge
import by.bnd.wotcost.domain.CustomTabResult
import by.bnd.wotcost.domain.PlayerSession
import by.bnd.wotcost.domain.Screen
import by.bnd.wotcost.ui.PlayerScreen
import by.bnd.wotcost.ui.WotCostTheme
import by.bnd.wotcost.ui.resolvesDark
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private val model: SessionViewModel by viewModels()

    override fun attachBaseContext(newBase: android.content.Context) {
        migrateLanguagePreference(newBase)
        super.attachBaseContext(newBase)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        model.syncPlatformLanguage()
        enableEdgeToEdge()
        AuthBridge.launch = { url -> openCustomTab(url) }
        consumeAuthIntent(intent)
        setContent {
            val session = model.session
            var theme by remember { mutableStateOf(session.themePreference()) }
            var onCover by remember { mutableStateOf(session.screen() is Screen.ChooseRealm) }
            DisposableEffect(session) {
                val unsubscribe = session.subscribe {
                    theme = session.themePreference()
                    onCover = session.screen() is Screen.ChooseRealm
                }
                onDispose { unsubscribe() }
            }
            val dark = theme.resolvesDark(isSystemInDarkTheme())
            SideEffect {
                val transparent = android.graphics.Color.TRANSPARENT
                val bars = if (dark) {
                    SystemBarStyle.dark(transparent)
                } else {
                    SystemBarStyle.light(transparent, transparent)
                }
                val status = if (onCover) SystemBarStyle.light(transparent, transparent) else bars
                val navigation = if (onCover) SystemBarStyle.dark(transparent) else bars
                enableEdgeToEdge(statusBarStyle = status, navigationBarStyle = navigation)
                AuthBridge.darkChrome = dark
            }
            WotCostTheme(theme) {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    WotCostApp(session)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        consumeAuthIntent(intent)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus || !AuthBridge.launched) return
        window.decorView.postDelayed({
            if (AuthBridge.launched && hasWindowFocus()) {
                AuthBridge.complete(CustomTabResult.Dismiss)
            }
        }, 250)
    }

    private fun openCustomTab(url: String) {
        val scheme = if (AuthBridge.darkChrome) {
            CustomTabsIntent.COLOR_SCHEME_DARK
        } else {
            CustomTabsIntent.COLOR_SCHEME_LIGHT
        }
        CustomTabsIntent.Builder()
            .setShowTitle(true)
            .setColorScheme(scheme)
            .build()
            .launchUrl(this, Uri.parse(url))
    }

    private fun consumeAuthIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "wotcost" || data.host != "auth") return
        AuthBridge.complete(CustomTabResult.Success(data.toString()))
        setIntent(Intent())
    }
}

@Composable
private fun WotCostApp(session: PlayerSession) {
    var screen by remember { mutableStateOf(session.screen()) }
    DisposableEffect(session) {
        screen = session.screen()
        val unsubscribe = session.subscribe { screen = session.screen() }
        onDispose { unsubscribe() }
    }
    BackHandler(enabled = screen is Screen.Settings) {
        session.closeSettings()
    }
    val scope = rememberCoroutineScope()
    PlayerScreen(
        screen = screen,
        onChooseRealm = { realm -> scope.launch { session.chooseRealm(realm) } },
        onSignOut = { scope.launch { session.signOut() } },
        onRetry = { scope.launch { session.retry() } },
        onOpenSettings = session::openSettings,
        onCloseSettings = session::closeSettings,
        onOpenTheme = session::openThemeSettings,
        onOpenLanguage = session::openLanguageSettings,
        onChooseTheme = session::setTheme,
        onChooseLanguage = { preference ->
            when (preference) {
                by.bnd.wotcost.domain.LanguagePreference.Device -> session.followDeviceLanguage()
                is by.bnd.wotcost.domain.LanguagePreference.Fixed -> session.setLanguage(preference.id)
            }
        },
    )
}
