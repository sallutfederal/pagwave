package com.pagwave.android.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class MonochromeKpiKind { INFLOW, OUTFLOW, NET, COUNT }

/**
 * Monochrome black-and-white layered fintech icon badge matching Pagwave web's
 * `TransactionKpiIcon` (`src/components/transactions/kpi-icons.tsx`).
 */
@Composable
fun MonochromeKpiBadge(
    kind: MonochromeKpiKind,
    modifier: Modifier = Modifier,
    badgeSize: Dp = 46.dp,
) {
    val c = PagwaveThemeTokens.colors
    val fg = c.foreground
    val shape = RoundedCornerShape(15.dp)

    Box(
        modifier = modifier
            .size(badgeSize)
            .clip(shape)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        fg.copy(alpha = 0.08f),
                        c.surfaceSubtle,
                        Color.Transparent,
                    ),
                ),
            )
            .border(width = 1.dp, color = c.line, shape = shape),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.size(24.dp)) {
            val s = size.width / 28f

            when (kind) {
                MonochromeKpiKind.INFLOW -> {
                    val basin = Path().apply {
                        moveTo(5f * s, 16.5f * s)
                        lineTo(5f * s, 19.75f * s)
                        quadraticTo(5f * s, 23f * s, 8.25f * s, 23f * s)
                        lineTo(19.75f * s, 23f * s)
                        quadraticTo(23f * s, 23f * s, 23f * s, 19.75f * s)
                        lineTo(23f * s, 16.5f * s)
                    }
                    drawPath(
                        path = basin,
                        brush = Brush.verticalGradient(
                            colors = listOf(fg.copy(alpha = 0.16f), fg.copy(alpha = 0.02f)),
                            startY = 13f * s,
                            endY = 23f * s,
                        ),
                    )
                    drawPath(
                        path = basin,
                        color = fg.copy(alpha = 0.85f),
                        style = Stroke(width = 1.7f * s, cap = StrokeCap.Round),
                    )
                    val arrow = Path().apply {
                        moveTo(14f * s, 5.2f * s)
                        lineTo(14f * s, 16.2f * s)
                        moveTo(10.2f * s, 12.4f * s)
                        lineTo(14f * s, 16.2f * s)
                        lineTo(17.8f * s, 12.4f * s)
                    }
                    drawPath(
                        path = arrow,
                        color = fg,
                        style = Stroke(
                            width = 1.85f * s,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                    drawCircle(color = fg, radius = 1.3f * s, center = Offset(14f * s, 19.6f * s))
                }

                MonochromeKpiKind.OUTFLOW -> {
                    drawRoundRect(
                        brush = Brush.linearGradient(
                            colors = listOf(fg.copy(alpha = 0.16f), fg.copy(alpha = 0.02f)),
                        ),
                        topLeft = Offset(4.75f * s, 8.75f * s),
                        size = Size(14.5f * s, 14.5f * s),
                        cornerRadius = CornerRadius(3.5f * s, 3.5f * s),
                    )
                    drawRoundRect(
                        color = fg.copy(alpha = 0.38f),
                        topLeft = Offset(4.75f * s, 8.75f * s),
                        size = Size(14.5f * s, 14.5f * s),
                        cornerRadius = CornerRadius(3.5f * s, 3.5f * s),
                        style = Stroke(width = 1.45f * s),
                    )
                    drawCircle(
                        color = fg.copy(alpha = 0.28f),
                        radius = 3.2f * s,
                        center = Offset(21f * s, 7f * s),
                        style = Stroke(width = 1.2f * s),
                    )
                    val arrow = Path().apply {
                        moveTo(11f * s, 17f * s)
                        lineTo(21.2f * s, 6.8f * s)
                        moveTo(15.8f * s, 6.8f * s)
                        lineTo(21.2f * s, 6.8f * s)
                        lineTo(21.2f * s, 12.2f * s)
                    }
                    drawPath(
                        path = arrow,
                        color = fg,
                        style = Stroke(
                            width = 1.85f * s,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                    drawCircle(color = fg.copy(alpha = 0.9f), radius = 1.4f * s, center = Offset(11f * s, 17f * s))
                }

                MonochromeKpiKind.NET -> {
                    drawLine(
                        color = fg.copy(alpha = 0.25f),
                        start = Offset(4.5f * s, 21.5f * s),
                        end = Offset(23.5f * s, 21.5f * s),
                        strokeWidth = 1.25f * s,
                        cap = StrokeCap.Round,
                    )
                    val fillWave = Path().apply {
                        moveTo(5f * s, 17.8f * s)
                        cubicTo(8.4f * s, 10.6f * s, 12.1f * s, 11.2f * s, 14.4f * s, 15.8f * s)
                        cubicTo(16.8f * s, 20.4f * s, 20.1f * s, 18.6f * s, 22.8f * s, 9.2f * s)
                        lineTo(22.8f * s, 21.5f * s)
                        lineTo(5f * s, 21.5f * s)
                        close()
                    }
                    drawPath(
                        path = fillWave,
                        brush = Brush.verticalGradient(
                            colors = listOf(fg.copy(alpha = 0.2f), Color.Transparent),
                            startY = 8f * s,
                            endY = 22f * s,
                        ),
                    )
                    val wave = Path().apply {
                        moveTo(5f * s, 17.8f * s)
                        cubicTo(8.4f * s, 10.6f * s, 12.1f * s, 11.2f * s, 14.4f * s, 15.8f * s)
                        cubicTo(16.8f * s, 20.4f * s, 20.1f * s, 18.6f * s, 22.8f * s, 9.2f * s)
                    }
                    drawPath(
                        path = wave,
                        color = fg,
                        style = Stroke(width = 1.9f * s, cap = StrokeCap.Round),
                    )
                    drawCircle(color = fg, radius = 2.1f * s, center = Offset(22.8f * s, 9.2f * s))
                    drawCircle(
                        color = fg.copy(alpha = 0.28f),
                        radius = 4f * s,
                        center = Offset(22.8f * s, 9.2f * s),
                        style = Stroke(width = 1.1f * s),
                    )
                }

                MonochromeKpiKind.COUNT -> {
                    val backSheet = Path().apply {
                        moveTo(9.5f * s, 6.2f * s)
                        lineTo(9.5f * s, 5.5f * s)
                        quadraticTo(9.5f * s, 3.25f * s, 11.75f * s, 3.25f * s)
                        lineTo(19.75f * s, 3.25f * s)
                        quadraticTo(22f * s, 3.25f * s, 22f * s, 5.5f * s)
                        lineTo(22f * s, 17.75f * s)
                        quadraticTo(22f * s, 20f * s, 19.75f * s, 20f * s)
                        lineTo(19f * s, 20f * s)
                    }
                    drawPath(
                        path = backSheet,
                        color = fg.copy(alpha = 0.34f),
                        style = Stroke(width = 1.4f * s, cap = StrokeCap.Round),
                    )
                    drawRoundRect(
                        brush = Brush.linearGradient(
                            colors = listOf(fg.copy(alpha = 0.16f), fg.copy(alpha = 0.03f)),
                        ),
                        topLeft = Offset(5.5f * s, 6.75f * s),
                        size = Size(13.5f * s, 17.5f * s),
                        cornerRadius = CornerRadius(3f * s, 3f * s),
                    )
                    drawRoundRect(
                        color = fg.copy(alpha = 0.85f),
                        topLeft = Offset(5.5f * s, 6.75f * s),
                        size = Size(13.5f * s, 17.5f * s),
                        cornerRadius = CornerRadius(3f * s, 3f * s),
                        style = Stroke(width = 1.6f * s),
                    )
                    drawLine(fg.copy(alpha = 0.72f), Offset(9f * s, 12f * s), Offset(15.5f * s, 12f * s), 1.5f * s, StrokeCap.Round)
                    drawLine(fg.copy(alpha = 0.72f), Offset(9f * s, 15.5f * s), Offset(15.5f * s, 15.5f * s), 1.5f * s, StrokeCap.Round)
                    drawLine(fg.copy(alpha = 0.72f), Offset(9f * s, 19f * s), Offset(13f * s, 19f * s), 1.5f * s, StrokeCap.Round)
                    drawCircle(color = fg, radius = 1.25f * s, center = Offset(15.8f * s, 19f * s))
                }
            }
        }
    }
}
