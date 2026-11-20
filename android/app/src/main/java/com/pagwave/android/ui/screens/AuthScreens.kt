package com.pagwave.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.AppStrings
import com.pagwave.android.core.i18n.PagwaveLocale
import com.pagwave.android.ui.state.AppUiState

enum class AuthMode { LOGIN, REGISTER, FORGOT }

@Composable
fun AuthScreen(
    state: AppUiState,
    strings: AppStrings,
    onLogin: (String, String, String?) -> Unit,
    onRegister: (String, String, String, String, String, String?) -> Unit,
    onForgotPassword: (String) -> Unit,
    onToggleTheme: () -> Unit,
    onSelectLocale: (PagwaveLocale) -> Unit,
    onClearMessages: () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    var mode by remember { mutableStateOf(AuthMode.LOGIN) }

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var twoFactorCode by remember { mutableStateOf("") }
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var accountType by remember { mutableStateOf("PERSONAL") }
    var companyName by remember { mutableStateOf("") }
    var localeMenuOpen by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(c.background, if (c.isDark) Color(0xFF040507) else c.background),
                ),
            )
            .statusBarsPadding()
            .imePadding(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            // Top bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PagwaveLogoLockup(markSize = 32.dp)

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box {
                        IconButton(
                            onClick = { localeMenuOpen = true },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(c.surfaceSubtle),
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Language,
                                contentDescription = strings.settingsLanguage,
                                tint = c.mutedForeground,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                        DropdownMenu(
                            expanded = localeMenuOpen,
                            onDismissRequest = { localeMenuOpen = false },
                        ) {
                            PagwaveLocale.entries.forEach { loc ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = loc.nativeName,
                                            fontWeight = if (loc == state.locale) FontWeight.Bold else FontWeight.Normal,
                                        )
                                    },
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
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(c.surfaceSubtle),
                    ) {
                        Icon(
                            imageVector = if (c.isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                            contentDescription = strings.settingsTheme,
                            tint = c.mutedForeground,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Main Obsidian Glass Card
            PagwaveCard(modifier = Modifier.fillMaxWidth()) {
                when (mode) {
                    AuthMode.LOGIN -> {
                        Text(
                            text = strings.signInTitle,
                            color = c.foreground,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = strings.signInSubtitle,
                            color = c.mutedForeground,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(top = 6.dp, bottom = 20.dp),
                        )
                    }
                    AuthMode.REGISTER -> {
                        Text(
                            text = strings.createAccountCta,
                            color = c.foreground,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = strings.signInSubtitle,
                            color = c.mutedForeground,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(top = 6.dp, bottom = 16.dp),
                        )
                    }
                    AuthMode.FORGOT -> {
                        Text(
                            text = strings.forgotPasswordCta,
                            color = c.foreground,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                if (state.authError != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(c.dangerSoft)
                            .padding(12.dp),
                    ) {
                        Text(text = state.authError, color = c.danger, fontSize = 12.sp)
                    }
                }

                if (state.authNotice != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(c.brandGoldSoft)
                            .padding(12.dp),
                    ) {
                        Text(text = state.authNotice, color = c.brandGold, fontSize = 12.sp)
                    }
                }

                if (mode == AuthMode.REGISTER) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        listOf(
                            "PERSONAL" to strings.accountPersonal,
                            "BUSINESS" to strings.accountBusiness,
                        ).forEach { (id, label) ->
                            val selected = accountType == id
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(CircleShape)
                                    .background(if (selected) c.accent else c.surfaceSubtle)
                                    .clickable { accountType = id }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = label,
                                    color = if (selected) c.accentFg else c.mutedForeground,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
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
                    Spacer(modifier = Modifier.height(12.dp))

                    if (accountType == "BUSINESS") {
                        PagwaveTextField(
                            value = companyName,
                            onValueChange = { companyName = it },
                            label = strings.companyNameLabel,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }

                PagwaveTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = strings.emailLabel,
                    placeholder = "voce@empresa.com",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                )

                if (mode != AuthMode.FORGOT) {
                    Spacer(modifier = Modifier.height(12.dp))
                    PagwaveTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = strings.passwordLabel,
                        placeholder = "••••••••",
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                    contentDescription = null,
                                    tint = c.mutedForeground,
                                )
                            }
                        },
                    )
                }

                if (mode == AuthMode.REGISTER && password.isNotEmpty()) {
                    val checks = listOf(
                        password.length >= 8,
                        password.any { it.isUpperCase() },
                        password.any { it.isDigit() },
                        password.any { !it.isLetterOrDigit() },
                    ).count { it }
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { checks / 4f },
                        color = if (checks >= 4) c.success else c.brandGold,
                        trackColor = c.surfaceSubtle,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(CircleShape),
                    )
                }

                if (mode == AuthMode.LOGIN && state.authRequires2FA) {
                    Spacer(modifier = Modifier.height(12.dp))
                    PagwaveTextField(
                        value = twoFactorCode,
                        onValueChange = { if (it.length <= 6) twoFactorCode = it.filter { ch -> ch.isDigit() } },
                        label = strings.twoFactorCodeLabel,
                        placeholder = "000000",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                when (mode) {
                    AuthMode.LOGIN -> {
                        PagwavePrimaryButton(
                            text = strings.signInCta,
                            loading = state.authLoading,
                            onClick = { onLogin(email, password, twoFactorCode) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            TextButton(
                                onClick = {
                                    onClearMessages()
                                    mode = AuthMode.FORGOT
                                },
                            ) {
                                Text(strings.forgotPasswordCta, color = c.mutedForeground, fontSize = 12.sp)
                            }
                            TextButton(
                                onClick = {
                                    onClearMessages()
                                    mode = AuthMode.REGISTER
                                },
                            ) {
                                Text(strings.createAccountCta, color = c.foreground, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    AuthMode.REGISTER -> {
                        PagwavePrimaryButton(
                            text = strings.createAccountCta,
                            loading = state.authLoading,
                            onClick = {
                                onRegister(firstName, lastName, email, password, accountType, companyName)
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(
                            onClick = {
                                onClearMessages()
                                mode = AuthMode.LOGIN
                            },
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                        ) {
                            Text(strings.backToLogin, color = c.mutedForeground, fontSize = 13.sp)
                        }
                    }

                    AuthMode.FORGOT -> {
                        PagwavePrimaryButton(
                            text = strings.forgotPasswordSend,
                            loading = state.authLoading,
                            onClick = { onForgotPassword(email) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(
                            onClick = {
                                onClearMessages()
                                mode = AuthMode.LOGIN
                            },
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                        ) {
                            Text(strings.backToLogin, color = c.mutedForeground, fontSize = 13.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "pagwave · Global Financial Infrastructure",
                color = c.subtleForeground,
                fontSize = 11.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }
    }
}
