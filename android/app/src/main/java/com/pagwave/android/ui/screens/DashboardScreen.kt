package com.pagwave.android.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.AppStrings
import com.pagwave.android.core.model.CurrenciesCatalog
import com.pagwave.android.core.model.TransactionDto
import com.pagwave.android.ui.state.AppUiState

@Composable
fun DashboardScreen(
    state: AppUiState,
    strings: AppStrings,
    onQuickAction: (String) -> Unit,
    onSelectPeriod: (String) -> Unit,
    onOpenTransactions: () -> Unit,
    onOpenWallet: () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val preferredOrder = listOf("USD", "EUR", "BRL", "USDT", "MXN", "COP", "ARS", "BOB", "CLP", "VES", "USDC")
    val balanceList = preferredOrder.mapNotNull { code ->
        state.wallets.balances[code]?.let { code to it }
    }.let { list ->
        val nonZero = list.filter { it.second.available > 0.0 || it.second.blocked > 0.0 }
        if (nonZero.isNotEmpty()) nonZero else list.take(4)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Greeting Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = state.summary.greeting.title.ifBlank { strings.welcomeBack },
                    color = c.foreground,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.4).sp,
                )
                Text(
                    text = state.summary.greeting.subtitle.ifBlank { state.profileEmail },
                    color = c.mutedForeground,
                    fontSize = 13.sp,
                )
            }
        }

        // Wallets Carousel (mirroring web's Wallets strip)
        item {
            SectionHeader(
                title = strings.walletsTitle,
                action = {
                    Text(
                        text = strings.seeAll,
                        color = c.mutedForeground,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.clickable(onClick = onOpenWallet),
                    )
                },
            )
            Spacer(modifier = Modifier.height(10.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(balanceList, key = { it.first }) { (code, bal) ->
                    val spec = CurrenciesCatalog.spec(code)
                    PagwaveCard(
                        modifier = Modifier.width(186.dp),
                        contentPadding = PaddingValues(16.dp),
                        onClick = onOpenWallet,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = spec.name,
                                color = c.mutedForeground,
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f),
                            )
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(c.surfaceSubtle)
                                    .border(1.dp, c.line, CircleShape)
                                    .padding(horizontal = 8.dp, vertical = 3.dp),
                            ) {
                                Text(
                                    text = code,
                                    color = c.foreground,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = CurrenciesCatalog.format(bal.available, code),
                            color = c.foreground,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 19.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                        )
                        if (bal.blocked > 0.0) {
                            Text(
                                text = "Bloqueado: ${CurrenciesCatalog.format(bal.blocked, code)}",
                                color = c.warning,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }
            }
        }

        // Quick Actions (matching web: Transferir P2P highlighted pill + Depositar + Sacar + Extrato)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                QuickActionPill(
                    label = strings.quickTransfer,
                    icon = Icons.AutoMirrored.Outlined.Send,
                    highlighted = true,
                    onClick = { onQuickAction("transfer") },
                    modifier = Modifier.weight(1f),
                )
                QuickActionPill(
                    label = strings.quickDeposit,
                    icon = Icons.Outlined.ArrowDownward,
                    highlighted = false,
                    onClick = { onQuickAction("deposit") },
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                QuickActionPill(
                    label = strings.quickWithdraw,
                    icon = Icons.Outlined.ArrowUpward,
                    highlighted = false,
                    onClick = { onQuickAction("withdraw") },
                    modifier = Modifier.weight(1f),
                )
                QuickActionPill(
                    label = strings.quickStatement,
                    icon = Icons.AutoMirrored.Outlined.ReceiptLong,
                    highlighted = false,
                    onClick = { onQuickAction("statement") },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // Statistics Donut Card
        item {
            PagwaveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = strings.statisticsTitle,
                        color = c.foreground,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("this-month" to "Mês", "last-month" to "Ant.", "last-year" to "Ano").forEach { (id, lbl) ->
                            val active = state.selectedPeriod == id
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(if (active) c.accent else c.surfaceSubtle)
                                    .clickable { onSelectPeriod(id) }
                                    .padding(horizontal = 10.dp, vertical = 5.dp),
                            ) {
                                Text(
                                    text = lbl,
                                    color = if (active) c.accentFg else c.mutedForeground,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    val segs = state.statistic.segments
                    val total = state.statistic.total
                    Canvas(modifier = Modifier.size(144.dp)) {
                        val stroke = 20.dp.toPx()
                        if (total <= 0.0 || segs.isEmpty()) {
                            drawArc(
                                color = c.chartMoney.copy(alpha = 0.25f),
                                startAngle = 0f,
                                sweepAngle = 360f,
                                useCenter = false,
                                style = Stroke(width = stroke, cap = StrokeCap.Round),
                            )
                        } else {
                            var startAngle = -90f
                            segs.forEachIndexed { idx, seg ->
                                val sweep = seg.degrees.toFloat().coerceIn(0f, 360f)
                                if (sweep > 0f) {
                                    drawArc(
                                        color = if (idx == 0) c.chartBills else c.chartMoney,
                                        startAngle = startAngle,
                                        sweepAngle = sweep,
                                        useCenter = false,
                                        style = Stroke(width = stroke, cap = StrokeCap.Butt),
                                    )
                                    startAngle += sweep
                                }
                            }
                        }
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = CurrenciesCatalog.format(state.statistic.total, "USD"),
                            color = c.foreground,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = state.statistic.label.ifBlank { "Saídas" },
                            color = c.mutedForeground,
                            fontSize = 11.sp,
                        )
                    }
                }
            }
        }

        // Recent Transactions
        item {
            PagwaveCard {
                SectionHeader(
                    title = strings.recentTransactions,
                    action = {
                        Text(
                            text = strings.seeAll,
                            color = c.mutedForeground,
                            fontSize = 12.sp,
                            modifier = Modifier.clickable(onClick = onOpenTransactions),
                        )
                    },
                )
                Spacer(modifier = Modifier.height(12.dp))
                if (state.transactions.isEmpty()) {
                    Text(
                        text = strings.noTransactions,
                        color = c.mutedForeground,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(vertical = 12.dp),
                    )
                } else {
                    state.transactions.take(5).forEachIndexed { idx, tx ->
                        CompactTransactionRow(tx = tx)
                        if (idx < minOf(4, state.transactions.lastIndex)) {
                            Spacer(modifier = Modifier.height(10.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickActionPill(
    label: String,
    icon: ImageVector,
    highlighted: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    val bg = if (highlighted) c.accent else c.surface
    val fg = if (highlighted) c.accentFg else c.foreground
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, if (highlighted) c.accent else c.line, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = fg, modifier = Modifier.size(18.dp))
        Text(
            text = label,
            color = fg,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun CompactTransactionRow(
    tx: TransactionDto,
    onClick: (() -> Unit)? = null,
) {
    val c = PagwaveThemeTokens.colors
    val isIn = tx.direction == "in"
    val tone = when (tx.status) {
        "Completed" -> StatusTone.SUCCESS
        "Pending" -> StatusTone.PENDING
        else -> StatusTone.DANGER
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.surfaceSubtle)
            .let { if (onClick != null) it.clickable(onClick = onClick) else it }
            .padding(horizontal = 12.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(if (isIn) c.successSoft else c.dangerSoft),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (isIn) Icons.Outlined.ArrowDownward else Icons.Outlined.ArrowUpward,
                contentDescription = null,
                tint = if (isIn) c.success else c.danger,
                modifier = Modifier.size(18.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = tx.title,
                color = c.foreground,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = "${tx.subtitle} · ${tx.method}",
                color = c.mutedForeground,
                fontSize = 11.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = CurrenciesCatalog.format(tx.amount, tx.currency, signed = true),
                color = if (isIn) c.success else c.foreground,
                fontFamily = FontFamily.Monospace,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(modifier = Modifier.height(3.dp))
            PagwaveStatusBadge(text = tx.status, tone = tone)
        }
    }
}
