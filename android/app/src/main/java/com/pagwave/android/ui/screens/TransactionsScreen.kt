package com.pagwave.android.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(
    state: AppUiState,
    strings: AppStrings,
) {
    val c = PagwaveThemeTokens.colors
    var query by remember { mutableStateOf("") }
    var direction by remember { mutableStateOf("all") } // all | in | out
    var selectedTx by remember { mutableStateOf<TransactionDto?>(null) }

    val filtered = remember(state.transactions, query, direction) {
        val needle = query.trim().lowercase()
        state.transactions.filter { tx ->
            if (direction != "all" && tx.direction != direction) return@filter false
            if (needle.isNotBlank()) {
                val hay = "${tx.title} ${tx.subtitle} ${tx.category} ${tx.method} ${tx.currency}".lowercase()
                if (!hay.contains(needle)) return@filter false
            }
            true
        }
    }

    val totalIn = remember(filtered) {
        filtered.filter { it.status == "Completed" && it.direction == "in" }
            .sumOf { kotlin.math.abs(it.usdAmount ?: 0.0) }
    }
    val totalOut = remember(filtered) {
        filtered.filter { it.status == "Completed" && it.direction == "out" }
            .sumOf { kotlin.math.abs(it.usdAmount ?: 0.0) }
    }
    val netFlow = totalIn - totalOut

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // 2x2 Monochrome KPI Summary Grid matching web
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                KpiSummaryTile(
                    kind = MonochromeKpiKind.INFLOW,
                    label = strings.kpiInflows,
                    value = CurrenciesCatalog.format(totalIn, "USD"),
                    modifier = Modifier.weight(1f),
                )
                KpiSummaryTile(
                    kind = MonochromeKpiKind.OUTFLOW,
                    label = strings.kpiOutflows,
                    value = CurrenciesCatalog.format(totalOut, "USD"),
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                KpiSummaryTile(
                    kind = MonochromeKpiKind.NET,
                    label = strings.kpiNet,
                    value = CurrenciesCatalog.format(netFlow, "USD", signed = true),
                    modifier = Modifier.weight(1f),
                )
                KpiSummaryTile(
                    kind = MonochromeKpiKind.COUNT,
                    label = strings.kpiCount,
                    value = "${filtered.size}",
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // Search & Filter Toolbar
        item {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                singleLine = true,
                placeholder = { Text(strings.searchTransactions, color = c.subtleForeground, fontSize = 13.sp) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Outlined.Search,
                        contentDescription = null,
                        tint = c.mutedForeground,
                    )
                },
                shape = CircleShape,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.accent.copy(alpha = 0.55f),
                    unfocusedBorderColor = c.line,
                    focusedContainerColor = c.surfaceSubtle,
                    unfocusedContainerColor = c.surfaceSubtle,
                    focusedTextColor = c.foreground,
                    unfocusedTextColor = c.foreground,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(c.surfaceSubtle)
                    .border(1.dp, c.line, CircleShape)
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                listOf(
                    "all" to strings.filterAll,
                    "in" to strings.filterIn,
                    "out" to strings.filterOut,
                ).forEach { (id, lbl) ->
                    val active = direction == id
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(CircleShape)
                            .background(if (active) c.accent else c.surface.copy(alpha = 0f))
                            .clickable { direction = id }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = lbl,
                            color = if (active) c.accentFg else c.mutedForeground,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }

        if (filtered.isEmpty()) {
            item {
                PagwaveCard {
                    Text(
                        text = strings.noTransactions,
                        color = c.mutedForeground,
                        fontSize = 13.sp,
                    )
                }
            }
        } else {
            items(filtered, key = { it.id }) { tx ->
                CompactTransactionRow(
                    tx = tx,
                    onClick = { selectedTx = tx },
                )
            }
        }
    }

    // Transaction Receipt Detail Sheet
    selectedTx?.let { tx ->
        ModalBottomSheet(
            onDismissRequest = { selectedTx = null },
            containerColor = c.surface,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    text = tx.title,
                    color = c.foreground,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = CurrenciesCatalog.format(tx.amount, tx.currency, signed = true),
                    color = if (tx.direction == "in") c.success else c.foreground,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                )
                ReceiptLine("Referência", tx.subtitle)
                ReceiptLine("Categoria", tx.category)
                ReceiptLine("Método", tx.method)
                ReceiptLine("Status", tx.status)
                ReceiptLine("Data", tx.date.take(19).replace("T", " "))
                Spacer(modifier = Modifier.height(14.dp))
            }
        }
    }
}

@Composable
private fun KpiSummaryTile(
    kind: MonochromeKpiKind,
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    PagwaveCard(
        modifier = modifier,
        contentPadding = PaddingValues(14.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MonochromeKpiBadge(kind = kind, badgeSize = 42.dp)
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    color = c.mutedForeground,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = value,
                    color = c.foreground,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun ReceiptLine(label: String, value: String) {
    val c = PagwaveThemeTokens.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(c.surfaceSubtle)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, color = c.mutedForeground, fontSize = 12.sp)
        Text(text = value, color = c.foreground, fontFamily = FontFamily.Monospace, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}
