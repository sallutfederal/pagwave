package com.pagwave.android.core.designsystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PagwaveCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(18.dp),
    borderColor: Color? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val shape = RoundedCornerShape(22.dp)
    val mod = modifier
        .clip(shape)
        .background(
            brush = Brush.verticalGradient(
                colors = listOf(c.surface, c.surface.copy(alpha = if (c.isDark) 0.94f else 0.98f)),
            ),
            shape = shape,
        )
        .border(width = 1.dp, color = borderColor ?: c.line, shape = shape)
        .let { if (onClick != null) it.clickable(onClick = onClick) else it }

    Box(modifier = mod) {
        // Subtle top glass edge highlight matching `--card-shadow: inset 0 1px 0 ...`
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(c.innerSheen),
        )
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
}

@Composable
fun PagwavePrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    val c = PagwaveThemeTokens.colors
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = c.accent,
            contentColor = c.accentFg,
            disabledContainerColor = c.accent.copy(alpha = 0.4f),
            disabledContentColor = c.accentFg.copy(alpha = 0.6f),
        ),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        modifier = modifier.height(48.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(
                color = c.accentFg,
                strokeWidth = 2.dp,
                modifier = Modifier.size(18.dp),
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(
            text = text,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
        )
    }
}

@Composable
fun PagwaveOutlineButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    tint: Color? = null,
) {
    val c = PagwaveThemeTokens.colors
    val fg = tint ?: c.foreground
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = CircleShape,
        border = BorderStroke(1.dp, (tint ?: c.line).copy(alpha = if (tint != null) 0.45f else 1f)),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = c.surfaceSubtle,
            contentColor = fg,
        ),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
        modifier = modifier.height(42.dp),
    ) {
        Text(text = text, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun PagwaveTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    singleLine: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: (@Composable () -> Unit)? = null,
    enabled: Boolean = true,
) {
    val c = PagwaveThemeTokens.colors
    Column(modifier = modifier) {
        Text(
            text = label,
            color = c.mutedForeground,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(bottom = 6.dp, start = 4.dp),
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            enabled = enabled,
            singleLine = singleLine,
            placeholder = if (placeholder.isNotBlank()) {
                { Text(text = placeholder, color = c.subtleForeground, fontSize = 13.sp) }
            } else {
                null
            },
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            visualTransformation = visualTransformation,
            trailingIcon = trailingIcon,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = c.accent.copy(alpha = 0.6f),
                unfocusedBorderColor = c.line,
                focusedContainerColor = c.surfaceSubtle,
                unfocusedContainerColor = c.surfaceSubtle,
                focusedTextColor = c.foreground,
                unfocusedTextColor = c.foreground,
                cursorColor = c.accent,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

enum class StatusTone { SUCCESS, PENDING, DANGER, NEUTRAL, GOLD }

@Composable
fun PagwaveStatusBadge(
    text: String,
    tone: StatusTone,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    val (bg, fg) = when (tone) {
        StatusTone.SUCCESS -> c.successSoft to c.success
        StatusTone.PENDING -> c.warningSoft to c.warning
        StatusTone.DANGER -> c.dangerSoft to c.danger
        StatusTone.GOLD -> c.brandGoldSoft to c.brandGold
        StatusTone.NEUTRAL -> c.surfaceSubtle to c.mutedForeground
    }
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, fg.copy(alpha = 0.25f), CircleShape)
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(
            text = text,
            color = fg,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
fun CurrencyPill(
    code: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    val bg = if (selected) c.accent else c.surfaceSubtle
    val fg = if (selected) c.accentFg else c.foreground
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, if (selected) c.accent else c.line, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = currencyFlagEmoji(code),
            fontSize = 13.sp,
        )
        Text(
            text = code,
            color = fg,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.SemiBold,
            fontSize = 12.sp,
        )
    }
}

fun currencyFlagEmoji(code: String): String = when (code.uppercase()) {
    "BRL" -> "\uD83C\uDDE7\uD83C\uDDF7"
    "USD" -> "\uD83C\uDDFA\uD83C\uDDF8"
    "EUR" -> "\uD83C\uDDEA\uD83C\uDDFA"
    "MXN" -> "\uD83C\uDDF2\uD83C\uDDFD"
    "COP" -> "\uD83C\uDDE8\uD83C\uDDF4"
    "ARS" -> "\uD83C\uDDE6\uD83C\uDDF7"
    "BOB" -> "\uD83C\uDDE7\uD83C\uDDF4"
    "CLP" -> "\uD83C\uDDE8\uD83C\uDDF1"
    "VES" -> "\uD83C\uDDFB\uD83C\uDDEA"
    "USDT", "USDC" -> "\uD83E\uDE99"
    else -> "\uD83C\uDF10"
}

@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    action: (@Composable () -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = c.foreground,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    color = c.mutedForeground,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 2.dp),
                )
            }
        }
        if (action != null) {
            action()
        }
    }
}
