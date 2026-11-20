package com.pagwave.android.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Exact Compose vector replica of `LogoMark` (`src/components/brand/logo.tsx` & `src/app/icon.svg`):
 * obsidian gradient rounded tile, subtle gold edge rim, harmonic secondary stream,
 * luminous liquid wave, and golden crest node.
 */
@Composable
fun PagwaveLogoMark(
    modifier: Modifier = Modifier,
    size: Dp = 32.dp,
) {
    Canvas(modifier = modifier.size(size)) {
        val w = this.size.width
        val h = this.size.height
        val s = w / 64f
        val radius = CornerRadius(16f * s, 16f * s)

        // Obsidian tile
        drawRoundRect(
            brush = Brush.linearGradient(
                colors = listOf(Color(0xFF16181F), Color(0xFF07080B)),
                start = Offset.Zero,
                end = Offset(w, h),
            ),
            cornerRadius = radius,
        )

        // Top-left inner specular sheen
        drawRoundRect(
            brush = Brush.linearGradient(
                colors = listOf(Color(0x24FFFFFF), Color.Transparent),
                start = Offset.Zero,
                end = Offset(w * 0.6f, h),
            ),
            topLeft = Offset(1f * s, 1f * s),
            size = Size(w - 2f * s, h - 2f * s),
            cornerRadius = CornerRadius(15f * s, 15f * s),
        )

        // Gold metallic hairline edge
        drawRoundRect(
            brush = Brush.linearGradient(
                colors = listOf(
                    Color(0x9EE2BE72),
                    Color(0x29E2BE72),
                    Color(0x0AE2BE72),
                ),
                start = Offset.Zero,
                end = Offset(w, h),
            ),
            topLeft = Offset(1f * s, 1f * s),
            size = Size(w - 2f * s, h - 2f * s),
            cornerRadius = CornerRadius(15f * s, 15f * s),
            style = Stroke(width = 1.75f * s),
        )

        // Harmonic secondary flow
        val secondary = Path().apply {
            moveTo(14f * s, 44f * s)
            cubicTo(21f * s, 34f * s, 27.5f * s, 34.5f * s, 33.5f * s, 41.5f * s)
            cubicTo(39.5f * s, 48.5f * s, 45.5f * s, 46.5f * s, 51f * s, 36f * s)
        }
        drawPath(
            path = secondary,
            color = Color(0x61F3E3BD),
            style = Stroke(width = 3.2f * s, cap = StrokeCap.Round),
        )

        // Primary liquid wave
        val primary = Path().apply {
            moveTo(12f * s, 36.5f * s)
            cubicTo(18.5f * s, 18f * s, 27f * s, 18.5f * s, 32.5f * s, 31.5f * s)
            cubicTo(38f * s, 44.5f * s, 45.5f * s, 42.5f * s, 51f * s, 23f * s)
        }
        drawPath(
            path = primary,
            brush = Brush.linearGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFF3E3BD), Color(0xFFD4AE5F)),
                start = Offset(10f * s, 18f * s),
                end = Offset(52f * s, 42f * s),
            ),
            style = Stroke(width = 5.4f * s, cap = StrokeCap.Round),
        )

        // Crest node
        drawCircle(
            brush = Brush.linearGradient(
                colors = listOf(Color(0xFFF5DFA8), Color(0xFFC79A43)),
                start = Offset(47f * s, 19f * s),
                end = Offset(55f * s, 27f * s),
            ),
            radius = 3.6f * s,
            center = Offset(51f * s, 23f * s),
        )
    }
}

@Composable
fun PagwaveLogoLockup(
    modifier: Modifier = Modifier,
    markSize: Dp = 30.dp,
    wordmarkColor: Color = PagwaveThemeTokens.colors.foreground,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        PagwaveLogoMark(size = markSize)
        Text(
            text = "pagwave",
            color = wordmarkColor,
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = (-0.5).sp,
        )
    }
}
