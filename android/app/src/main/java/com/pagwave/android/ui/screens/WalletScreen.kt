package com.pagwave.android.ui.screens

import android.widget.Toast
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.AppStrings
import com.pagwave.android.core.model.CurrenciesCatalog
import com.pagwave.android.ui.state.AppUiState
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

enum class WalletTab { DEPOSIT, TRANSFER, CONVERT, WITHDRAW }

@Composable
fun WalletScreen(
    state: AppUiState,
    strings: AppStrings,
    initialTab: WalletTab = WalletTab.DEPOSIT,
    onCreateDeposit: (currency: String, method: String, amount: Double, payerName: String, payerTaxId: String) -> Unit,
    onSendP2P: (currency: String, email: String, amount: Double, desc: String) -> Unit,
    onSimulateFx: (from: String, to: String, amount: Double) -> Unit,
    onExecuteFx: (from: String, to: String, amount: Double) -> Unit,
    onRequestWithdraw: (beneficiaryId: String?, currency: String, rail: String, fieldKey: String, dest: String, amount: Double, desc: String) -> Unit,
    onSaveBeneficiary: (label: String, currency: String, rail: String, fieldKey: String, dest: String) -> Unit,
    onDeleteBeneficiary: (id: String) -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    var activeTab by remember(initialTab) { mutableStateOf(initialTab) }
    var selectedCurrency by remember { mutableStateOf("BRL") }

    // Deposit inputs
    var depositAmount by remember { mutableStateOf("100") }
    var payerName by remember { mutableStateOf("") }
    var payerTaxId by remember { mutableStateOf("") }

    // P2P inputs
    var recipientEmail by remember { mutableStateOf("") }
    var p2pAmount by remember { mutableStateOf("") }
    var p2pDesc by remember { mutableStateOf("") }

    // FX inputs
    var fxFrom by remember { mutableStateOf("BRL") }
    var fxTo by remember { mutableStateOf("USD") }
    var fxAmount by remember { mutableStateOf("100") }

    // Withdraw inputs
    var selectedBeneficiaryId by remember { mutableStateOf<String?>(null) }
    var withdrawDest by remember { mutableStateOf("") }
    var withdrawAmount by remember { mutableStateOf("") }
    var withdrawDesc by remember { mutableStateOf("") }
    var saveAsLabel by remember { mutableStateOf("") }

    val spec = CurrenciesCatalog.spec(selectedCurrency)
    val availableSelected = state.wallets.balances[selectedCurrency]?.available ?: 0.0

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Account / KYC Header + Multi-currency Strip
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = strings.walletsTitle,
                        color = c.foreground,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "${spec.name} · ${CurrenciesCatalog.format(availableSelected, selectedCurrency)}",
                        color = c.mutedForeground,
                        fontSize = 12.sp,
                    )
                }
                PagwaveStatusBadge(
                    text = "KYC Nível ${state.wallets.kycLevel}",
                    tone = if (state.wallets.kycStatus == "APPROVED") StatusTone.SUCCESS else StatusTone.GOLD,
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(CurrenciesCatalog.walletCurrencies) { code ->
                    CurrencyPill(
                        code = code,
                        selected = selectedCurrency == code,
                        onClick = { selectedCurrency = code },
                    )
                }
            }
        }

        // Balance Hero Tile for Selected Currency
        item {
            val bal = state.wallets.balances[selectedCurrency]
            PagwaveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "${currencyFlagEmoji(selectedCurrency)} ${spec.name} ($selectedCurrency)",
                            color = c.mutedForeground,
                            fontSize = 13.sp,
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = CurrenciesCatalog.format(bal?.available ?: 0.0, selectedCurrency),
                            color = c.foreground,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    if ((bal?.blocked ?: 0.0) > 0.0) {
                        PagwaveStatusBadge(
                            text = "Retido ${CurrenciesCatalog.format(bal?.blocked ?: 0.0, selectedCurrency)}",
                            tone = StatusTone.PENDING,
                        )
                    }
                }
            }
        }

        // Mode Selector Tabs
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(CircleShape)
                    .background(c.surface)
                    .border(1.dp, c.line, CircleShape)
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                listOf(
                    WalletTab.DEPOSIT to strings.tabDeposit,
                    WalletTab.TRANSFER to strings.tabTransfer,
                    WalletTab.CONVERT to strings.tabConvert,
                    WalletTab.WITHDRAW to strings.tabWithdraw,
                ).forEach { (tab, label) ->
                    val active = activeTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(CircleShape)
                            .background(if (active) c.accent else c.surface.copy(alpha = 0f))
                            .clickable { activeTab = tab }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = label,
                            color = if (active) c.accentFg else c.mutedForeground,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }

        // Active Tab Panel
        item {
            when (activeTab) {
                WalletTab.DEPOSIT -> {
                    PagwaveCard {
                        Text(
                            text = "${strings.tabDeposit} · ${spec.cashinMethod}",
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        PagwaveTextField(
                            value = depositAmount,
                            onValueChange = { depositAmount = it },
                            label = "${strings.amountLabel} ($selectedCurrency)",
                            placeholder = "100.00",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = payerName,
                            onValueChange = { payerName = it },
                            label = "Nome do pagador (opcional)",
                            placeholder = state.summary.greeting.name.ifBlank { "Titular" },
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = payerTaxId,
                            onValueChange = { payerTaxId = it },
                            label = "CPF/Documento (se exigido pelo trilho)",
                            placeholder = "Opcional",
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        PagwavePrimaryButton(
                            text = strings.generateDeposit,
                            loading = state.walletBusy,
                            onClick = {
                                val amt = depositAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                                if (amt > 0.0) {
                                    onCreateDeposit(selectedCurrency, spec.cashinMethod, amt, payerName, payerTaxId)
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )

                        // Cashin QR / EMV / Address result
                        state.cashinResult?.let { cashin ->
                            val qrCopy = cashin.result["qr_code"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["emv"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["pix_copy_paste"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["clabe"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["deposit_address"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["payment_url"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.externalId

                            Spacer(modifier = Modifier.height(16.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(c.surfaceSubtle)
                                    .border(1.dp, c.success.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                                    .padding(14.dp),
                            ) {
                                Column {
                                    Text(
                                        text = "Cobrança gerada (${cashin.externalId})",
                                        color = c.success,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = qrCopy,
                                        color = c.foreground,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        maxLines = 4,
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    PagwaveOutlineButton(
                                        text = strings.copyCode,
                                        onClick = {
                                            clipboard.setText(AnnotatedString(qrCopy))
                                            Toast.makeText(context, strings.copiedToast, Toast.LENGTH_SHORT).show()
                                        },
                                    )
                                }
                            }
                        }
                    }
                }

                WalletTab.TRANSFER -> {
                    PagwaveCard {
                        Text(
                            text = "${strings.quickTransfer} ($selectedCurrency)",
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "Envio instantâneo entre contas pagwave na mesma moeda.",
                            color = c.mutedForeground,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 14.dp),
                        )
                        PagwaveTextField(
                            value = recipientEmail,
                            onValueChange = { recipientEmail = it },
                            label = strings.recipientEmailLabel,
                            placeholder = "contato@empresa.com",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = p2pAmount,
                            onValueChange = { p2pAmount = it },
                            label = "${strings.amountLabel} ($selectedCurrency)",
                            placeholder = "50.00",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = p2pDesc,
                            onValueChange = { p2pDesc = it },
                            label = strings.descriptionOptional,
                            placeholder = "Pagamento de serviço",
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        PagwavePrimaryButton(
                            text = strings.sendTransfer,
                            loading = state.walletBusy,
                            onClick = {
                                val amt = p2pAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                                if (recipientEmail.isNotBlank() && amt > 0.0) {
                                    onSendP2P(selectedCurrency, recipientEmail, amt, p2pDesc)
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }

                WalletTab.CONVERT -> {
                    val convertible = CurrenciesCatalog.walletCurrencies.filter { CurrenciesCatalog.spec(it).convertible }
                    PagwaveCard {
                        Text(
                            text = strings.tabConvert,
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("De:", color = c.mutedForeground, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(convertible) { code ->
                                CurrencyPill(
                                    code = code,
                                    selected = fxFrom == code,
                                    onClick = { fxFrom = code },
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Para:", color = c.mutedForeground, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(convertible.filter { it != fxFrom }) { code ->
                                CurrencyPill(
                                    code = code,
                                    selected = fxTo == code,
                                    onClick = { fxTo = code },
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        PagwaveTextField(
                            value = fxAmount,
                            onValueChange = { fxAmount = it },
                            label = "${strings.amountLabel} ($fxFrom)",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        )

                        state.fxSimulation?.let { sim ->
                            val outAmt = sim["converted_amount"]?.jsonPrimitive?.contentOrNull
                                ?: sim["to_amount"]?.jsonPrimitive?.contentOrNull
                                ?: sim["amount_to"]?.jsonPrimitive?.contentOrNull
                            val rate = sim["rate"]?.jsonPrimitive?.contentOrNull
                                ?: sim["exchange_rate"]?.jsonPrimitive?.contentOrNull
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(c.brandGoldSoft)
                                    .padding(12.dp),
                            ) {
                                Column {
                                    Text(
                                        text = "Cotação estimada: ${outAmt ?: "--"} $fxTo",
                                        color = c.foreground,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                    )
                                    if (rate != null) {
                                        Text(
                                            text = "Taxa aplicada: $rate",
                                            color = c.mutedForeground,
                                            fontSize = 12.sp,
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            PagwaveOutlineButton(
                                text = strings.simulateQuote,
                                onClick = {
                                    val amt = fxAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                                    if (amt > 0.0 && fxFrom != fxTo) {
                                        onSimulateFx(fxFrom, fxTo, amt)
                                    }
                                },
                                modifier = Modifier.weight(1f),
                            )
                            PagwavePrimaryButton(
                                text = strings.executeConversion,
                                loading = state.walletBusy,
                                onClick = {
                                    val amt = fxAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                                    if (amt > 0.0 && fxFrom != fxTo) {
                                        onExecuteFx(fxFrom, fxTo, amt)
                                    }
                                },
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                WalletTab.WITHDRAW -> {
                    val currencyBeneficiaries = state.beneficiaries.filter { it.currency == selectedCurrency }
                    PagwaveCard {
                        Text(
                            text = "${strings.tabWithdraw} ($selectedCurrency · ${spec.cashoutRail})",
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        if (currencyBeneficiaries.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Chaves salvas:",
                                color = c.mutedForeground,
                                fontSize = 12.sp,
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            currencyBeneficiaries.forEach { ben ->
                                val selected = selectedBeneficiaryId == ben.id
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (selected) c.accentSoft else c.surfaceSubtle)
                                        .border(1.dp, if (selected) c.accent else c.line, RoundedCornerShape(14.dp))
                                        .clickable {
                                            selectedBeneficiaryId = if (selected) null else ben.id
                                        }
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(ben.label, color = c.foreground, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                        Text(ben.summary, color = c.mutedForeground, fontSize = 11.sp)
                                    }
                                    IconButton(onClick = { onDeleteBeneficiary(ben.id) }) {
                                        Icon(
                                            imageVector = Icons.Outlined.DeleteOutline,
                                            contentDescription = null,
                                            tint = c.mutedForeground,
                                        )
                                    }
                                }
                            }
                        }

                        if (selectedBeneficiaryId == null) {
                            Spacer(modifier = Modifier.height(10.dp))
                            PagwaveTextField(
                                value = withdrawDest,
                                onValueChange = { withdrawDest = it },
                                label = spec.cashoutFieldLabel,
                                placeholder = spec.cashoutPlaceholder,
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            PagwaveTextField(
                                value = saveAsLabel,
                                onValueChange = { saveAsLabel = it },
                                label = "Salvar chave com apelido (opcional)",
                                placeholder = "Ex.: Conta Principal",
                            )
                            if (saveAsLabel.isNotBlank() && withdrawDest.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                PagwaveOutlineButton(
                                    text = "Salvar destinatário",
                                    onClick = {
                                        onSaveBeneficiary(saveAsLabel, selectedCurrency, spec.cashoutRail, spec.cashoutFieldKey, withdrawDest)
                                        saveAsLabel = ""
                                    },
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = withdrawAmount,
                            onValueChange = { withdrawAmount = it },
                            label = "${strings.amountLabel} ($selectedCurrency)",
                            placeholder = "25.00",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        PagwaveTextField(
                            value = withdrawDesc,
                            onValueChange = { withdrawDesc = it },
                            label = strings.descriptionOptional,
                            placeholder = "Saque para conta externa",
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        PagwavePrimaryButton(
                            text = strings.requestWithdraw,
                            loading = state.walletBusy,
                            onClick = {
                                val amt = withdrawAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                                if (amt > 0.0 && (selectedBeneficiaryId != null || withdrawDest.isNotBlank())) {
                                    onRequestWithdraw(
                                        selectedBeneficiaryId,
                                        selectedCurrency,
                                        spec.cashoutRail,
                                        spec.cashoutFieldKey,
                                        withdrawDest,
                                        amt,
                                        withdrawDesc,
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }
}
