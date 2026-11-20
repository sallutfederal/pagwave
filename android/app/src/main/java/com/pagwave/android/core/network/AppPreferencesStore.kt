package com.pagwave.android.core.network

import android.content.Context
import com.pagwave.android.core.i18n.PagwaveLocale

class AppPreferencesStore(context: Context) {
    private val prefs = context.getSharedPreferences("pagwave_ui_prefs_v1", Context.MODE_PRIVATE)

    var darkTheme: Boolean
        get() = prefs.getBoolean(KEY_DARK_THEME, true)
        set(value) {
            prefs.edit().putBoolean(KEY_DARK_THEME, value).apply()
        }

    var locale: PagwaveLocale
        get() = PagwaveLocale.fromCode(prefs.getString(KEY_LOCALE, "pt"))
        set(value) {
            prefs.edit().putString(KEY_LOCALE, value.code).apply()
        }

    companion object {
        private const val KEY_DARK_THEME = "dark_theme"
        private const val KEY_LOCALE = "locale"
    }
}
