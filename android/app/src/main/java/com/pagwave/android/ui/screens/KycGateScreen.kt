package com.pagwave.android.ui.screens

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudUpload
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.LockClock
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.AppStrings
import com.pagwave.android.core.i18n.PagwaveLocale
import com.pagwave.android.ui.state.AppUiState

@Composable
fun KycGateScreen(
    state: AppUiState,
    strings: AppStrings,
    onSubmitKyc: (type: String, documentNumber: String, uri: Uri) -> Unit,
    onRefreshStatus: () -> Unit,
    onToggleTheme: () -> Unit,
    onSelectLocale: (PagwaveLocale) -> Unit,
    onLogout: () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    val context = LocalContext.current
    var localeMenuOpen by remember { mutableStateOf(false) }

    var docType by remember { mutableStateOf("IDENTITY_FRONT") }
    var docNumber by remember { mutableStateOf("") }
    var pickedUri by remember { mutableStateOf<Uri?>(null) }
    var pickedName by remember { mutableStateOf<String?>(null) }

    val docOptions = remember {
        listOf(
            SelectOption("IDENTITY_FRONT", "RG / CNH (Frente)"),
            SelectOption("IDENTITY_BACK", "RG / CNH (Verso)"),
            SelectOption("PASSPORT", "Passaporte"),
            SelectOption("SELFIE", "Selfie segurando o documento"),
            SelectOption("PROOF_OF_ADDRESS", "Comprovante de residência"),
            SelectOption("CORPORATE_REGISTRATION", "Contrato Social / CNPJ"),
            SelectOption("TAX_ID", "Comprovante Fiscal"),
        )
    }

    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri ->
        if (uri != null) {
            pickedUri = uri
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            pickedName = cursor?.use {
                val idx = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (it.moveToFirst() && idx >= 0) it.getString(idx) else null
            } ?: "documento-selecionado"
        }
    }

    val isRejected = state.kycStatus == "REJECTED"
    val isPending = state.kycStatus == "PENDING" || state.kycStatus == "IN_REVIEW"
    val latestRejection = state.kycDocs.firstOrNull { it.status == "REJECTED" }?.reviewNote

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Locked Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PagwaveLogoLockup(markSize = 28.dp)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Box {
                    IconButton(
                        onClick = { localeMenuOpen = true },
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(c.surfaceSubtle)
                            .border(1.dp, c.line, CircleShape),
                    ) {
                        Icon(Icons.Outlined.Language, strings.settingsLanguage, tint = c.mutedForeground, modifier = Modifier.size(18.dp))
                    }
                    DropdownMenu(expanded = localeMenuOpen, onDismissRequest = { localeMenuOpen = false }) {
                        PagwaveLocale.entries.forEach { loc ->
                            DropdownMenuItem(
                                text = { Text(loc.nativeName) },
                                onClick = {
                                    localeMenuOpen = false
                                    onSelectLocale(loc)
                                },
                            )
                        }
                    }
                }
                IconButton(
                    onClick = onToggleTheme,
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(c.surfaceSubtle)
                        .border(1.dp, c.line, CircleShape),
                ) {
                    Icon(
                        if (c.isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                        strings.settingsTheme,
                        tint = c.mutedForeground,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }

        // Main Non-Dismissible KYC Modal Card
        PagwaveCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isRejected) c.dangerSoft else if (isPending) c.warningSoft else c.accentSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = if (isRejected) Icons.Outlined.WarningAmber else Icons.Outlined.LockClock,
                            contentDescription = null,
                            tint = if (isRejected) c.danger else if (isPending) c.warning else c.foreground,
                        )
                    }
                    Column {
                        Text(
                            text = when {
                                isRejected -> "KYC recusado — reenvie"
                                isPending -> "KYC em análise"
                                else -> "Envie seu KYC obrigatório"
                            },
                            color = c.foreground,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = state.profileEmail,
                            color = c.mutedForeground,
                            fontSize = 11.sp,
                        )
                    }
                }
                PagwaveStatusBadge(
                    text = "${state.kycStatus} · ${state.kycLevel}/3",
                    tone = if (isRejected) StatusTone.DANGER else if (isPending) StatusTone.PENDING else StatusTone.NEUTRAL,
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = when {
                    isRejected -> "Seu documento anterior foi recusado. Envie um novo arquivo legível para liberar seu acesso."
                    isPending -> "Seus documentos foram recebidos. O acesso ao sistema permanece bloqueado até um administrador aprovar seu KYC."
                    else -> "Por segurança regulatória, o acesso ao sistema fica bloqueado até você enviar seus documentos de identidade e um administrador aprovar."
                },
                color = c.mutedForeground,
                fontSize = 13.sp,
                lineHeight = 19.sp,
            )

            if (isRejected && !latestRejection.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.dangerSoft)
                        .padding(10.dp),
                ) {
                    Text(
                        text = "Motivo: $latestRejection",
                        color = c.danger,
                        fontSize = 12.sp,
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            PagwaveDropdownField(
                label = "Tipo de documento",
                value = docType,
                options = docOptions,
                onSelect = { docType = it },
            )
            Spacer(modifier = Modifier.height(10.dp))
            PagwaveTextField(
                value = docNumber,
                onValueChange = { docNumber = it },
                label = "Número do documento (CPF / RG / CNPJ)",
                placeholder = "Opcional",
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(c.surfaceSubtle)
                    .border(1.dp, c.line, RoundedCornerShape(16.dp))
                    .clickable { filePicker.launch(arrayOf("image/*", "application/pdf")) }
                    .padding(horizontal = 14.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Icons.Outlined.CloudUpload, null, tint = c.mutedForeground)
                Text(
                    text = pickedName ?: "Selecionar foto ou PDF do documento...",
                    color = if (pickedName != null) c.foreground else c.mutedForeground,
                    fontSize = 13.sp,
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            PagwavePrimaryButton(
                text = if (isPending) "Enviar documento complementar" else "Enviar KYC para aprovação",
                loading = state.kycBusy,
                enabled = pickedUri != null,
                onClick = {
                    pickedUri?.let { uri ->
                        onSubmitKyc(docType, docNumber, uri)
                        pickedUri = null
                        pickedName = null
                        docNumber = ""
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PagwaveOutlineButton(
                    text = "Verificar aprovação",
                    onClick = onRefreshStatus,
                    modifier = Modifier.weight(1f),
                )
                PagwaveOutlineButton(
                    text = strings.signOut,
                    tint = c.danger,
                    onClick = onLogout,
                    modifier = Modifier.weight(1f),
                )
            }

            if (state.kycDocs.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Documentos enviados (${state.kycDocs.size}):",
                    color = c.mutedForeground,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(modifier = Modifier.height(8.dp))
                state.kycDocs.forEach { doc ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(c.surfaceSubtle)
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = doc.type,
                                color = c.foreground,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                            if (!doc.fileName.isNullOrBlank()) {
                                Text(doc.fileName, color = c.mutedForeground, fontSize = 11.sp)
                            }
                        }
                        PagwaveStatusBadge(
                            text = doc.status,
                            tone = when (doc.status) {
                                "APPROVED" -> StatusTone.SUCCESS
                                "REJECTED" -> StatusTone.DANGER
                                else -> StatusTone.PENDING
                            },
                        )
                    }
                }
            }
        }
    }
}
