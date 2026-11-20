package com.pagwave.android.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
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
import com.pagwave.android.core.model.DynamicFieldSpec
import com.pagwave.android.ui.state.AppUiState
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

enum class WalletTab { DEPOSIT, TRANSFER, CONVERT, WITHDRAW }

@Composable
fun WalletScreen(
    state: AppUiState,
    strings: AppStrings,
    initialTab: WalletTab = WalletTab.DEPOSIT,
    onCreateDeposit: (currency: String, method: String, mode: String, amount: Double?, payer: Map<String, String>) -> Unit,
    onSimulateSandbox: (requestNumber: String) -> Unit,
    onSendP2P: (currency: String, email: String, amount: Double, desc: String) -> Unit,
    onSimulateFx: (from: String, to: String, amount: Double) -> Unit,
    onExecuteFx: (from: String, to: String, amount: Double) -> Unit,
    onRequestWithdraw: (beneficiaryId: String?, currency: String, rail: String, details: Map<String, String>, amount: Double, desc: String) -> Unit,
    onSaveBeneficiary: (label: String, currency: String, rail: String, details: Map<String, String>) -> Unit,
    onDeleteBeneficiary: (id: String) -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    var activeTab by remember(initialTab) { mutableStateOf(initialTab) }
    var selectedCurrency by remember { mutableStateOf("BRL") }
    val spec = CurrenciesCatalog.spec(selectedCurrency)

    // Deposit inputs
    var depositMethod by remember(selectedCurrency) {
        mutableStateOf(spec.cashinMethods.firstOrNull()?.id ?: "")
    }
    var depositMode by remember(selectedCurrency) { mutableStateOf("dynamic") }
    var depositAmount by remember { mutableStateOf("100") }
    val payerValues = remember(selectedCurrency) { mutableStateMapOf<String, String>() }

    // P2P inputs
    var recipientEmail by remember { mutableStateOf("") }
    var p2pAmount by remember { mutableStateOf("") }
    var p2pDesc by remember { mutableStateOf("") }

    // FX inputs
    var fxFrom by remember { mutableStateOf("BRL") }
    var fxTo by remember { mutableStateOf("USD") }
    var fxAmount by remember { mutableStateOf("100") }

    // Withdraw inputs
    var selectedBeneficiaryId by remember(selectedCurrency) { mutableStateOf<String?>(null) }
    var selectedRail by remember(selectedCurrency) {
        mutableStateOf(spec.cashoutRails.firstOrNull()?.id ?: "")
    }
    val cashoutValues = remember(selectedCurrency, selectedRail) {
        mutableStateMapOf<String, String>().apply {
            spec.cashoutFields
                .filter { it.whenMethod == null || it.whenMethod.contains(selectedRail) }
                .forEach { field ->
                    val firstOpt = field.options?.firstOrNull()?.value
                    if (firstOpt != null) put(field.key, firstOpt)
                }
        }
    }
    var withdrawAmount by remember { mutableStateOf("") }
    var withdrawDesc by remember { mutableStateOf("") }
    var saveAsLabel by remember { mutableStateOf("") }

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
                            text = "${strings.tabDeposit} · $selectedCurrency",
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )

                        if (spec.cashinMethods.size > 1) {
                            Spacer(modifier = Modifier.height(10.dp))
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(spec.cashinMethods) { m ->
                                    RailChip(
                                        label = m.label,
                                        selected = depositMethod == m.id,
                                        onClick = { depositMethod = m.id },
                                    )
                                }
                            }
                        }

                        if (spec.supportsOpenValueCashin && depositMethod != "OXXO") {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                RailChip(
                                    label = "Valor fixo",
                                    selected = depositMode == "dynamic",
                                    onClick = { depositMode = "dynamic" },
                                )
                                RailChip(
                                    label = "Valor aberto (QR Estático)",
                                    selected = depositMode == "static",
                                    onClick = { depositMode = "static" },
                                )
                            }
                        } else if (depositMode != "dynamic") {
                            depositMode = "dynamic"
                        }

                        if (depositMode == "dynamic") {
                            Spacer(modifier = Modifier.height(12.dp))
                            PagwaveTextField(
                                value = depositAmount,
                                onValueChange = { depositAmount = it },
                                label = "${strings.amountLabel} ($selectedCurrency)",
                                placeholder = if (spec.integerOnly) "10000" else "100.00",
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = if (spec.integerOnly) KeyboardType.Number else KeyboardType.Decimal,
                                ),
                            )
                        }

                        spec.cashinPayerFields.forEach { field ->
                            Spacer(modifier = Modifier.height(10.dp))
                            DynamicFieldInput(
                                field = field,
                                value = payerValues[field.key].orEmpty(),
                                onValueChange = { payerValues[field.key] = it },
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        PagwavePrimaryButton(
                            text = strings.generateDeposit,
                            loading = state.walletBusy,
                            onClick = {
                                val amt = depositAmount.replace(",", ".").toDoubleOrNull()
                                if (depositMode == "dynamic" && (amt == null || amt <= 0.0)) {
                                    Toast.makeText(context, "Informe um valor válido.", Toast.LENGTH_SHORT).show()
                                    return@PagwavePrimaryButton
                                }
                                val missing = spec.cashinPayerFields.firstOrNull {
                                    it.required && payerValues[it.key].orEmpty().isBlank()
                                }
                                if (missing != null) {
                                    Toast.makeText(context, "Preencha: ${missing.label}", Toast.LENGTH_SHORT).show()
                                    return@PagwavePrimaryButton
                                }
                                onCreateDeposit(
                                    selectedCurrency,
                                    depositMethod,
                                    depositMode,
                                    amt,
                                    payerValues.toMap(),
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )

                        // Cashin QR / EMV / Address result
                        state.cashinResult?.let { cashin ->
                            val copyable = cashin.result["qr_code_text"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["emv"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["qr_code"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["pix_copy_paste"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["clabe"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["deposit_address"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["cvu"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["barcode"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.externalId

                            val checkoutUrl = cashin.result["checkout_url"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["payment_url"]?.jsonPrimitive?.contentOrNull
                                ?: cashin.result["ticket_url"]?.jsonPrimitive?.contentOrNull

                            val requestNum = cashin.result["request_number"]?.jsonPrimitive?.contentOrNull

                            Spacer(modifier = Modifier.height(16.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(c.surfaceSubtle)
                                    .border(1.dp, c.success.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                                    .padding(14.dp),
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                    Text(
                                        text = "Cobrança pronta (${cashin.externalId})",
                                        color = c.success,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    if (copyable.length >= 12) {
                                        Spacer(modifier = Modifier.height(12.dp))
                                        PagwaveQrCode(content = copyable, size = 164.dp)
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = copyable,
                                        color = c.foreground,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        maxLines = 4,
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    ) {
                                        PagwaveOutlineButton(
                                            text = strings.copyCode,
                                            onClick = {
                                                clipboard.setText(AnnotatedString(copyable))
                                                Toast.makeText(context, strings.copiedToast, Toast.LENGTH_SHORT).show()
                                            },
                                            modifier = Modifier.weight(1f),
                                        )
                                        if (!checkoutUrl.isNullOrBlank()) {
                                            PagwaveOutlineButton(
                                                text = "Abrir Checkout",
                                                onClick = {
                                                    runCatching {
                                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(checkoutUrl)))
                                                    }
                                                },
                                                modifier = Modifier.weight(1f),
                                            )
                                        }
                                    }
                                    if (state.wallets.isSandbox && !requestNum.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        PagwaveOutlineButton(
                                            text = "Simular Pagamento (Sandbox)",
                                            tint = c.brandGold,
                                            onClick = { onSimulateSandbox(requestNum) },
                                            modifier = Modifier.fillMaxWidth(),
                                        )
                                    }
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
                                if (recipientEmail.isBlank() || amt <= 0.0) {
                                    Toast.makeText(context, "Informe e-mail válido e valor > 0.", Toast.LENGTH_SHORT).show()
                                    return@PagwavePrimaryButton
                                }
                                onSendP2P(selectedCurrency, recipientEmail, amt, p2pDesc)
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
                                    onClick = {
                                        fxFrom = code
                                        if (fxTo == code) fxTo = convertible.first { it != code }
                                    },
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
                                ?: sim["net_amount"]?.jsonPrimitive?.contentOrNull
                                ?: sim["estimated_amount"]?.jsonPrimitive?.contentOrNull
                                ?: sim["to_amount"]?.jsonPrimitive?.contentOrNull
                            val rate = sim["rate"]?.jsonPrimitive?.contentOrNull
                                ?: sim["exchange_rate"]?.jsonPrimitive?.contentOrNull
                            val fee = sim["fee"]?.jsonPrimitive?.contentOrNull
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(c.brandGoldSoft)
                                    .padding(12.dp),
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Text(
                                        text = "Você receberá: ${outAmt ?: "--"} $fxTo",
                                        color = c.foreground,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                    )
                                    if (rate != null) {
                                        Text("Taxa: 1 $fxFrom = $rate $fxTo", color = c.mutedForeground, fontSize = 12.sp)
                                    }
                                    if (fee != null) {
                                        Text("Tarifa: $fee", color = c.mutedForeground, fontSize = 11.sp)
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
                    val activeFields = spec.cashoutFields.filter {
                        it.whenMethod == null || it.whenMethod.contains(selectedRail)
                    }

                    PagwaveCard {
                        Text(
                            text = "${strings.tabWithdraw} ($selectedCurrency · $selectedRail)",
                            color = c.foreground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                        )

                        if (currencyBeneficiaries.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("Chaves / destinos salvos:", color = c.mutedForeground, fontSize = 12.sp)
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
                            if (spec.cashoutRails.size > 1) {
                                Spacer(modifier = Modifier.height(10.dp))
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(spec.cashoutRails) { r ->
                                        RailChip(
                                            label = r.label,
                                            selected = selectedRail == r.id,
                                            onClick = { selectedRail = r.id },
                                        )
                                    }
                                }
                            }

                            activeFields.forEach { field ->
                                Spacer(modifier = Modifier.height(10.dp))
                                DynamicFieldInput(
                                    field = field,
                                    value = cashoutValues[field.key].orEmpty(),
                                    onValueChange = { cashoutValues[field.key] = it },
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            PagwaveTextField(
                                value = saveAsLabel,
                                onValueChange = { saveAsLabel = it },
                                label = "Salvar favorecido com apelido (opcional)",
                                placeholder = "Ex.: Minha Conta Principal",
                            )
                            if (saveAsLabel.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                PagwaveOutlineButton(
                                    text = "Salvar destinatário no banco",
                                    onClick = {
                                        val missing = activeFields.firstOrNull {
                                            it.required && cashoutValues[it.key].orEmpty().isBlank()
                                        }
                                        if (missing != null) {
                                            Toast.makeText(context, "Preencha: ${missing.label}", Toast.LENGTH_SHORT).show()
                                            return@PagwaveOutlineButton
                                        }
                                        onSaveBeneficiary(saveAsLabel, selectedCurrency, selectedRail, cashoutValues.toMap())
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
                            keyboardOptions = KeyboardOptions(
                                keyboardType = if (spec.integerOnly) KeyboardType.Number else KeyboardType.Decimal,
                            ),
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
                                if (amt <= 0.0) {
                                    Toast.makeText(context, "Informe um valor maior que zero.", Toast.LENGTH_SHORT).show()
                                    return@PagwavePrimaryButton
                                }
                                if (selectedBeneficiaryId == null) {
                                    val missing = activeFields.firstOrNull {
                                        it.required && cashoutValues[it.key].orEmpty().isBlank()
                                    }
                                    if (missing != null) {
                                        Toast.makeText(context, "Preencha: ${missing.label}", Toast.LENGTH_SHORT).show()
                                        return@PagwavePrimaryButton
                                    }
                                }
                                onRequestWithdraw(
                                    selectedBeneficiaryId,
                                    selectedCurrency,
                                    selectedRail,
                                    cashoutValues.toMap(),
                                    amt,
                                    withdrawDesc,
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DynamicFieldInput(
    field: DynamicFieldSpec,
    value: String,
    onValueChange: (String) -> Unit,
) {
    val label = if (field.required) "${field.label} *" else field.label
    if (field.options != null) {
        PagwaveDropdownField(
            label = label,
            value = value.ifBlank { field.options.firstOrNull()?.value.orEmpty() },
            options = field.options,
            onSelect = onValueChange,
        )
    } else {
        PagwaveTextField(
            value = value,
            onValueChange = onValueChange,
            label = label,
            placeholder = field.placeholder,
            keyboardOptions = KeyboardOptions(
                keyboardType = if (field.isEmail) KeyboardType.Email else KeyboardType.Text,
            ),
        )
    }
}

@Composable
private fun RailChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selected) c.accent else c.surfaceSubtle)
            .border(1.dp, if (selected) c.accent else c.line, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            color = if (selected) c.accentFg else c.foreground,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}
