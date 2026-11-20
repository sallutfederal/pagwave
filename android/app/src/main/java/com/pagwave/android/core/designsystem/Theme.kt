package com.pagwave.android.core.designsystem

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

@Immutable
data class PagwaveColors(
    val isDark: Boolean,
    val background: Color,
    val surface: Color,
    val surfaceSubtle: Color,
    val surfaceHover: Color,
    val rail: Color,
    val foreground: Color,
    val mutedForeground: Color,
    val subtleForeground: Color,
    val line: Color,
    val innerSheen: Color,
    val accent: Color,
    val accentFg: Color,
    val accentSoft: Color,
    val brandGold: Color,
    val brandGoldSoft: Color,
    val success: Color,
    val successSoft: Color,
    val warning: Color,
    val warningSoft: Color,
    val danger: Color,
    val dangerSoft: Color,
    val blackCard: Color,
    val chartBills: Color,
    val chartMoney: Color,
)

val ObsidianDarkColors = PagwaveColors(
    isDark = true,
    background = Color(0xFF08090C),
    surface = Color(0xFF13151A),
    surfaceSubtle = Color(0x0EFFFFFF),
    surfaceHover = Color(0x18FFFFFF),
    rail = Color(0xFF07080B),
    foreground = Color(0xFFF4F5F7),
    mutedForeground = Color(0xFF9CA3AF),
    subtleForeground = Color(0xFF6B7280),
    line = Color(0x1CFFFFFF),
    innerSheen = Color(0x16FFFFFF),
    accent = Color(0xFFF4F5F7),
    accentFg = Color(0xFF090A0D),
    accentSoft = Color(0x1AFFFFFF),
    brandGold = Color(0xFFE2BE72),
    brandGoldSoft = Color(0x24E2BE72),
    success = Color(0xFF34D399),
    successSoft = Color(0x2134D399),
    warning = Color(0xFFFBBF24),
    warningSoft = Color(0x24FBBF24),
    danger = Color(0xFFFB7185),
    dangerSoft = Color(0x24FB7185),
    blackCard = Color(0xFF06070A),
    chartBills = Color(0xFFF4F5F7),
    chartMoney = Color(0xFF3F4652),
)

val MistLightColors = PagwaveColors(
    isDark = false,
    background = Color(0xFFECEEE9),
    surface = Color(0xFFF8F9F7),
    surfaceSubtle = Color(0x8FFFFFFF),
    surfaceHover = Color(0x0D18181B),
    rail = Color(0xFF0A0B0E),
    foreground = Color(0xFF111317),
    mutedForeground = Color(0xFF626875),
    subtleForeground = Color(0xFF8F96A3),
    line = Color(0x17111317),
    innerSheen = Color(0xCCFFFFFF),
    accent = Color(0xFF18191D),
    accentFg = Color(0xFFFFFFFF),
    accentSoft = Color(0x1418191D),
    brandGold = Color(0xFFC79A43),
    brandGoldSoft = Color(0x24C79A43),
    success = Color(0xFF15803D),
    successSoft = Color(0x1F16A34A),
    warning = Color(0xFFB45309),
    warningSoft = Color(0x24F59E0B),
    danger = Color(0xFFDC2626),
    dangerSoft = Color(0x1FEF4444),
    blackCard = Color(0xFF090A0D),
    chartBills = Color(0xFF18191D),
    chartMoney = Color(0xFF9AA1AD),
)

val LocalPagwaveColors = staticCompositionLocalOf { ObsidianDarkColors }

private val PagwaveTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.5).sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.3).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.2).sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        lineHeight = 20.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        lineHeight = 18.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp,
    ),
)

@Composable
fun PagwaveTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val palette = if (darkTheme) ObsidianDarkColors else MistLightColors

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = palette.accent,
            onPrimary = palette.accentFg,
            secondary = palette.brandGold,
            onSecondary = palette.rail,
            background = palette.background,
            onBackground = palette.foreground,
            surface = palette.surface,
            onSurface = palette.foreground,
            surfaceVariant = palette.surfaceSubtle,
            onSurfaceVariant = palette.mutedForeground,
            outline = palette.line,
            error = palette.danger,
            onError = Color.White,
        )
    } else {
        lightColorScheme(
            primary = palette.accent,
            onPrimary = palette.accentFg,
            secondary = palette.brandGold,
            onSecondary = Color.White,
            background = palette.background,
            onBackground = palette.foreground,
            surface = palette.surface,
            onSurface = palette.foreground,
            surfaceVariant = palette.surfaceSubtle,
            onSurfaceVariant = palette.mutedForeground,
            outline = palette.line,
            error = palette.danger,
            onError = Color.White,
        )
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            window.statusBarColor = palette.background.toArgb()
            window.navigationBarColor = if (darkTheme) palette.rail.toArgb() else palette.surface.toArgb()
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalPagwaveColors provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = PagwaveTypography,
            content = content,
        )
    }
}

object PagwaveThemeTokens {
    val colors: PagwaveColors
        @Composable get() = LocalPagwaveColors.current
}
