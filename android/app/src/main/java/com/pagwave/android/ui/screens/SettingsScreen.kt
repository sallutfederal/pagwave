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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.AppStrings
import com.pagwave.android.core.i18n.PagwaveLocale
import com.pagwave.android.core.model.NotificationPreferencesDto
import com.pagwave.android.ui.state.AppUiState

@Composable
fun SettingsScreen(
    state: AppUiState,
    strings: AppStrings,
    onSaveProfile: (firstName: String, lastName: String, phone: String, country: String, companyName: String) -> Unit,
    onUpdatePref: (NotificationPreferencesDto) -> Unit,
    onTestNotification: () -> Unit,
    onWeeklyDigest: () -> Unit,
    onSelectLocale: (PagwaveLocale) -> Unit,
    onToggleTheme: () -> Unit,
    onChangePassword: (current: String, next: String) -> Unit,
    onSetup2FA: () -> Unit,
    onConfirm2FA: (code: String) -> Unit,
    onDisable2FA: (password: String) -> Unit,
    onRevealApiSecret: () -> Unit,
    onSaveIntegrationConfig: (label: String, webhookUrl: String) -> Unit,
    onRotateApiKey: () -> Unit,
    onLogoutAll: () -> Unit,
    onLogout: () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    var firstName by remember(state.profile) { mutableStateOf(state.profile?.firstName.orEmpty()) }
    var lastName by remember(state.profile) { mutableStateOf(state.profile?.lastName.orEmpty()) }
    var phone by remember(state.profile) { mutableStateOf(state.profile?.phone.orEmpty()) }
    var country by remember(state.profile) { mutableStateOf(state.profile?.country.orEmpty()) }
    var company by remember(state.profile) { mutableStateOf(state.profile?.companyName.orEmpty()) }

    var currentPass by remember { mutableStateOf("") }
    var newPass by remember { mutableStateOf("") }
    var totpCode by remember { mutableStateOf("") }
    var disable2FAPass by remember { mutableStateOf("") }

    var apiLabel by remember(state.integrations.credential) {
        mutableStateOf(state.integrations.credential?.label.orEmpty())
    }
    var webhookUrl by remember(state.integrations.credential) {
        mutableStateOf(state.integrations.credential?.webhookUrl.orEmpty())
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Account & KYC
        item {
            PagwaveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(strings.settingsProfile, color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text(state.profileEmail, color = c.mutedForeground, fontSize = 12.sp)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (state.emailVerified) {
                            PagwaveStatusBadge(text = "E-mail OK", tone = StatusTone.SUCCESS)
                        }
                        PagwaveStatusBadge(
                            text = state.profile?.kycStatus ?: state.wallets.kycStatus,
                            tone = if ((state.profile?.kycStatus ?: state.wallets.kycStatus) == "APPROVED") StatusTone.SUCCESS else StatusTone.GOLD,
                        )
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    PagwaveTextField(
                        value = firstName,
                        onValueChange = { firstName = it },
                        label = strings.firstNameLabel,
                        modifier = Modifier.weight(1f),
                    )
                    PagwaveTextField(
                        value = lastName,
                        onValueChange = { lastName = it },
                        label = strings.lastNameLabel,
                        modifier = Modifier.weight(1f),
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    PagwaveTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = "Telefone",
                        modifier = Modifier.weight(1.4f),
                    )
                    PagwaveTextField(
                        value = country,
                        onValueChange = { if (it.length <= 3) country = it },
                        label = "País",
                        placeholder = "BR",
                        modifier = Modifier.weight(0.6f),
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                PagwaveTextField(
                    value = company,
                    onValueChange = { company = it },
                    label = strings.companyNameLabel,
                )
                Spacer(modifier = Modifier.height(14.dp))
                PagwavePrimaryButton(
                    text = strings.saveProfile,
                    loading = state.walletBusy,
                    onClick = { onSaveProfile(firstName, lastName, phone, country, company) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // Notifications (4 switches synced with Postgres + Test + Weekly Digest)
        item {
            val prefs = state.preferences
            PagwaveCard {
                Text(strings.settingsNotifications, color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(10.dp))
                PrefSwitchRow(strings.prefPaymentAlerts, prefs.paymentAlerts) {
                    onUpdatePref(prefs.copy(paymentAlerts = it))
                }
                PrefSwitchRow(strings.prefWeeklyDigest, prefs.weeklyDigest) {
                    onUpdatePref(prefs.copy(weeklyDigest = it))
                }
                PrefSwitchRow(strings.prefWebhooks, prefs.productRenewals) {
                    onUpdatePref(prefs.copy(productRenewals = it))
                }
                PrefSwitchRow(strings.prefSecurity, prefs.securityNotices) {
                    onUpdatePref(prefs.copy(securityNotices = it))
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    PagwaveOutlineButton(
                        text = strings.testNotification,
                        onClick = onTestNotification,
                        modifier = Modifier.weight(1f),
                    )
                    PagwaveOutlineButton(
                        text = "Resumo 7 dias",
                        onClick = onWeeklyDigest,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        // Language & Theme
        item {
            PagwaveCard {
                Text(strings.settingsLanguage, color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    PagwaveLocale.entries.take(3).forEach { loc ->
                        LocaleChip(loc, state.locale == loc, onSelectLocale, Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    PagwaveLocale.entries.drop(3).forEach { loc ->
                        LocaleChip(loc, state.locale == loc, onSelectLocale, Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
                PagwaveOutlineButton(
                    text = if (state.darkTheme) "${strings.settingsTheme}: Obsidian Dark" else "${strings.settingsTheme}: Mist Light",
                    onClick = onToggleTheme,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // Security & 2FA
        item {
            PagwaveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(strings.settingsSecurity, color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    PagwaveStatusBadge(
                        text = if (state.twoFactorEnabled) "2FA Ativo" else "2FA Desativado",
                        tone = if (state.twoFactorEnabled) StatusTone.SUCCESS else StatusTone.NEUTRAL,
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                PagwaveTextField(
                    value = currentPass,
                    onValueChange = { currentPass = it },
                    label = "Senha atual",
                    visualTransformation = PasswordVisualTransformation(),
                )
                Spacer(modifier = Modifier.height(8.dp))
                PagwaveTextField(
                    value = newPass,
                    onValueChange = { newPass = it },
                    label = "Nova senha (mín. 8 caracteres)",
                    visualTransformation = PasswordVisualTransformation(),
                )
                Spacer(modifier = Modifier.height(10.dp))
                PagwaveOutlineButton(
                    text = "Alterar senha",
                    onClick = {
                        if (currentPass.isNotBlank() && newPass.length >= 8) {
                            onChangePassword(currentPass, newPass)
                            currentPass = ""
                            newPass = ""
                        } else {
                            Toast.makeText(context, "Informe senha atual e nova senha (8+ caracteres).", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(14.dp))
                if (state.twoFactorEnabled) {
                    PagwaveTextField(
                        value = disable2FAPass,
                        onValueChange = { disable2FAPass = it },
                        label = "Senha para desativar 2FA",
                        visualTransformation = PasswordVisualTransformation(),
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    PagwaveOutlineButton(
                        text = "Desativar 2FA",
                        tint = c.danger,
                        onClick = {
                            if (disable2FAPass.isNotBlank()) {
                                onDisable2FA(disable2FAPass)
                                disable2FAPass = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                } else {
                    PagwaveOutlineButton(
                        text = "Configurar 2FA (Autenticador)",
                        onClick = onSetup2FA,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    state.twoFactorSetup?.secret?.let { secret ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(c.surfaceSubtle)
                                .clickable {
                                    clipboard.setText(AnnotatedString(secret))
                                    Toast.makeText(context, strings.copiedToast, Toast.LENGTH_SHORT).show()
                                }
                                .padding(10.dp),
                        ) {
                            Text(
                                text = "Chave 2FA (toque para copiar): $secret",
                                color = c.foreground,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        PagwaveTextField(
                            value = totpCode,
                            onValueChange = { if (it.length <= 6) totpCode = it.filter { ch -> ch.isDigit() } },
                            label = "Confirmar código de 6 dígitos",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        PagwavePrimaryButton(
                            text = "Ativar 2FA",
                            onClick = {
                                if (totpCode.length == 6) {
                                    onConfirm2FA(totpCode)
                                    totpCode = ""
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }

        // Full API Integrations Management
        state.integrations.credential?.let { cred ->
            item {
                PagwaveCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(strings.settingsApi, color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        PagwaveStatusBadge(
                            text = if (state.integrations.isSandbox) "Sandbox" else "Produção",
                            tone = if (state.integrations.isSandbox) StatusTone.GOLD else StatusTone.SUCCESS,
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Client ID: ${cred.clientId}", color = c.foreground, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    Text(
                        text = if (state.revealedApiSecret != null) {
                            "Secret: ${state.revealedApiSecret}"
                        } else {
                            "Secret: ${cred.secretPreview}"
                        },
                        color = c.mutedForeground,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    Text(
                        text = "Chamadas API: ${cred.requestCount} · Logs recentes: ${state.integrations.logs.size}",
                        color = c.subtleForeground,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PagwaveOutlineButton(
                            text = "Copiar Client ID",
                            onClick = {
                                clipboard.setText(AnnotatedString(cred.clientId))
                                Toast.makeText(context, strings.copiedToast, Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                        )
                        PagwaveOutlineButton(
                            text = if (state.revealedApiSecret != null) "Copiar Secret" else "Revelar Secret",
                            onClick = {
                                if (state.revealedApiSecret != null) {
                                    clipboard.setText(AnnotatedString(state.revealedApiSecret))
                                    Toast.makeText(context, strings.copiedToast, Toast.LENGTH_SHORT).show()
                                } else {
                                    onRevealApiSecret()
                                }
                            },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    PagwaveTextField(
                        value = apiLabel,
                        onValueChange = { apiLabel = it },
                        label = "Rótulo da aplicação",
                        placeholder = "Minha Integração",
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    PagwaveTextField(
                        value = webhookUrl,
                        onValueChange = { webhookUrl = it },
                        label = "Webhook URL",
                        placeholder = "https://seu-backend.com/webhook",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PagwavePrimaryButton(
                            text = "Salvar Webhook",
                            onClick = { onSaveIntegrationConfig(apiLabel, webhookUrl) },
                            modifier = Modifier.weight(1f),
                        )
                        PagwaveOutlineButton(
                            text = "Rotacionar Chave",
                            tint = c.warning,
                            onClick = onRotateApiKey,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        }

        // Session Controls & Logout
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PagwaveOutlineButton(
                    text = "Encerrar sessões",
                    onClick = onLogoutAll,
                    modifier = Modifier.weight(1f),
                )
                PagwaveOutlineButton(
                    text = strings.signOut,
                    onClick = onLogout,
                    tint = c.danger,
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun PrefSwitchRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            color = c.foreground,
            fontSize = 13.sp,
            modifier = Modifier
                .weight(1f)
                .padding(end = 10.dp),
        )
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = c.accentFg,
                checkedTrackColor = c.accent,
                uncheckedThumbColor = c.mutedForeground,
                uncheckedTrackColor = c.surfaceSubtle,
            ),
        )
    }
}

@Composable
private fun LocaleChip(
    locale: PagwaveLocale,
    selected: Boolean,
    onSelect: (PagwaveLocale) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = PagwaveThemeTokens.colors
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(if (selected) c.accent else c.surfaceSubtle)
            .border(1.dp, if (selected) c.accent else c.line, CircleShape)
            .clickable { onSelect(locale) }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = locale.nativeName,
            color = if (selected) c.accentFg else c.foreground,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}
