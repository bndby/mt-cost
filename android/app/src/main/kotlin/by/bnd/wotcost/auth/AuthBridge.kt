package by.bnd.wotcost.auth

import by.bnd.wotcost.domain.CustomTab
import by.bnd.wotcost.domain.CustomTabResult
import kotlinx.coroutines.CompletableDeferred

object AuthBridge : CustomTab {
    var launch: ((String) -> Unit)? = null
    var darkChrome: Boolean = true
    var launched: Boolean = false
        private set

    private var pending: CompletableDeferred<CustomTabResult>? = null

    override suspend fun open(url: String): CustomTabResult {
        val deferred = CompletableDeferred<CustomTabResult>()
        pending = deferred
        launched = true
        val opener = launch ?: error("custom tab is not attached")
        opener(url)
        return deferred.await()
    }

    fun complete(result: CustomTabResult) {
        launched = false
        val current = pending ?: return
        pending = null
        current.complete(result)
    }
}
