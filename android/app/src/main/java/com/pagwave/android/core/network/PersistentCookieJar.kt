package com.pagwave.android.core.network

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

@Serializable
private data class StoredCookie(
    val name: String,
    val value: String,
    val expiresAt: Long,
    val domain: String,
    val path: String,
    val secure: Boolean,
    val httpOnly: Boolean,
)

class PersistentCookieJar(context: Context) : CookieJar {
    private val json = Json { ignoreUnknownKeys = true }
    private val prefs: SharedPreferences = createSecurePrefs(context)
    private val cache = ConcurrentHashMap<String, List<Cookie>>()

    init {
        loadFromPrefs()
    }

    private fun createSecurePrefs(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (_: Exception) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    @Synchronized
    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val existing = cache[host].orEmpty().associateBy { "${it.name}|${it.path}" }.toMutableMap()
        val now = System.currentTimeMillis()

        for (cookie in cookies) {
            val key = "${cookie.name}|${cookie.path}"
            if (cookie.expiresAt <= now || cookie.value.isEmpty()) {
                existing.remove(key)
            } else {
                existing[key] = cookie
            }
        }
        cache[host] = existing.values.toList()
        persist()
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        val valid = cache[url.host].orEmpty().filter { cookie ->
            cookie.expiresAt > now && cookie.matches(url)
        }
        return valid
    }

    @Synchronized
    fun hasActiveSession(): Boolean {
        val now = System.currentTimeMillis()
        return cache.values.flatten().any {
            (it.name == "pw_access" || it.name == "pw_refresh") && it.expiresAt > now
        }
    }

    @Synchronized
    fun clear() {
        cache.clear()
        prefs.edit().remove(KEY_COOKIES).apply()
    }

    private fun persist() {
        val serializable = cache.mapValues { (_, list) ->
            list.map {
                StoredCookie(
                    name = it.name,
                    value = it.value,
                    expiresAt = it.expiresAt,
                    domain = it.domain,
                    path = it.path,
                    secure = it.secure,
                    httpOnly = it.httpOnly,
                )
            }
        }
        prefs.edit().putString(KEY_COOKIES, json.encodeToString(serializable)).apply()
    }

    private fun loadFromPrefs() {
        val raw = prefs.getString(KEY_COOKIES, null) ?: return
        val parsed = runCatching {
            json.decodeFromString<Map<String, List<StoredCookie>>>(raw)
        }.getOrNull() ?: return

        val now = System.currentTimeMillis()
        for ((host, list) in parsed) {
            val cookies = list.filter { it.expiresAt > now }.map { s ->
                Cookie.Builder()
                    .name(s.name)
                    .value(s.value)
                    .expiresAt(s.expiresAt)
                    .domain(s.domain)
                    .path(s.path)
                    .apply {
                        if (s.secure) secure()
                        if (s.httpOnly) httpOnly()
                    }
                    .build()
            }
            if (cookies.isNotEmpty()) {
                cache[host] = cookies
            }
        }
    }

    companion object {
        private const val PREFS_NAME = "pagwave_secure_session_v1"
        private const val KEY_COOKIES = "cookies_json"
    }
}
