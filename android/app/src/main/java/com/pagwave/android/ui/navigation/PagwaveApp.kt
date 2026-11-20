package com.pagwave.android.ui.navigation

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pagwave.android.core.designsystem.*
import com.pagwave.android.core.i18n.PagwaveLocale
import com.pagwave.android.core.i18n.stringsFor
import com.pagwave.android.ui.screens.*
import com.pagwave.android.ui.state.AppViewModel

enum class MainTab { DASHBOARD, WALLET, TRANSACTIONS, SETTINGS }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PagwaveApp(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsState()
    val strings = remember(state.locale) { stringsFor(state.locale) }
    val layoutDirection = if (state.locale.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(state.bannerMessage) {
        val msg = state.bannerMessage ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg)
        viewModel.clearBanner()
    }

    CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
        PagwaveTheme(darkTheme = state.darkTheme) {
            val c = PagwaveThemeTokens.colors

            when {
                state.checkingSession -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(c.background),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            PagwaveLogoMark(size = 56.dp)
                            CircularProgressIndicator(
                                color = c.brandGold,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(22.dp),
                            )
                        }
                    }
                }

                !state.isAuthenticated -> {
                    AuthScreen(
                        state = state,
                        strings = strings,
                        onLogin = viewModel::login,
                        onRegister = viewModel::register,
                        onForgotPassword = viewModel::forgotPassword,
                        onToggleTheme = viewModel::toggleTheme,
                        onSelectLocale = viewModel::setLocale,
                        onClearMessages = viewModel::resetAuthMessages,
                    )
                }

                else -> {
                    var currentTab by remember { mutableStateOf(MainTab.DASHBOARD) }
                    var walletInitialTab by remember { mutableStateOf(WalletTab.DEPOSIT) }
                    var showNotifications by remember { mutableStateOf(false) }
                    var localeDropdown by remember { mutableStateOf(false) }

                    Scaffold(
                        containerColor = c.background,
                        snackbarHost = {
                            SnackbarHost(hostState = snackbarHostState) { data ->
                                Snackbar(
                                    snackbarData = data,
                                    containerColor = if (state.bannerIsError) c.danger else c.surface,
                                    contentColor = if (state.bannerIsError) Color.White else c.foreground,
                                    shape = RoundedCornerShape(16.dp),
                                )
                            }
                        },
                        topBar = {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(c.background.copy(alpha = 0.92f))
                                    .statusBarsPadding()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                PagwaveLogoLockup(markSize = 28.dp)

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    // Refresh button
                                    TopIconCircle(
                                        onClick = { viewModel.refreshAll() },
                                        enabled = !state.loadingData,
                                    ) {
                                        if (state.loadingData) {
                                            CircularProgressIndicator(
                                                color = c.foreground,
                                                strokeWidth = 1.6.dp,
                                                modifier = Modifier.size(16.dp),
                                            )
                                        } else {
                                            Icon(
                                                imageVector = Icons.Outlined.Refresh,
                                                contentDescription = strings.refreshLabel,
                                                tint = c.mutedForeground,
                                                modifier = Modifier.size(18.dp),
                                            )
                                        }
                                    }

                                    // Notifications Bell
                                    Box {
                                        TopIconCircle(onClick = { showNotifications = true }) {
                                            Icon(
                                                imageVector = Icons.Outlined.Notifications,
                                                contentDescription = strings.notificationsTitle,
                                                tint = c.mutedForeground,
                                                modifier = Modifier.size(18.dp),
                                            )
                                        }
                                        if (state.unreadCount > 0) {
                                            Box(
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .size(16.dp)
                                                    .clip(CircleShape)
                                                    .background(c.accent),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Text(
                                                    text = if (state.unreadCount > 9) "9+" else "${state.unreadCount}",
                                                    color = c.accentFg,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                )
                                            }
                                        }
                                    }

                                    // Language Switcher
                                    Box {
                                        TopIconCircle(onClick = { localeDropdown = true }) {
                                            Icon(
                                                imageVector = Icons.Outlined.Language,
                                                contentDescription = strings.settingsLanguage,
                                                tint = c.mutedForeground,
                                                modifier = Modifier.size(18.dp),
                                            )
                                        }
                                        DropdownMenu(
                                            expanded = localeDropdown,
                                            onDismissRequest = { localeDropdown = false },
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
                                                        localeDropdown = false
                                                        viewModel.setLocale(loc)
                                                    },
                                                )
                                            }
                                        }
                                    }

                                    // Theme Toggle
                                    TopIconCircle(onClick = viewModel::toggleTheme) {
                                        Icon(
                                            imageVector = if (c.isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                                            contentDescription = strings.settingsTheme,
                                            tint = c.mutedForeground,
                                            modifier = Modifier.size(18.dp),
                                        )
                                    }
                                }
                            }
                        },
                        bottomBar = {
                            NavigationBar(
                                containerColor = if (c.isDark) c.rail else c.surface,
                                tonalElevation = 0.dp,
                                modifier = Modifier
                                    .border(1.dp, c.line)
                                    .navigationBarsPadding(),
                            ) {
                                val tabs: List<Triple<MainTab, String, ImageVector>> = listOf(
                                    Triple(MainTab.DASHBOARD, strings.navDashboard, Icons.Outlined.Dashboard),
                                    Triple(MainTab.WALLET, strings.navWallet, Icons.Outlined.AccountBalanceWallet),
                                    Triple(MainTab.TRANSACTIONS, strings.navTransactions, Icons.Outlined.SwapHoriz),
                                    Triple(MainTab.SETTINGS, strings.navSettings, Icons.Outlined.Settings),
                                )
                                tabs.forEach { (tab, label, icon) ->
                                    NavigationBarItem(
                                        selected = currentTab == tab,
                                        onClick = { currentTab = tab },
                                        icon = { Icon(imageVector = icon, contentDescription = label) },
                                        label = { Text(text = label, fontSize = 11.sp, maxLines = 1) },
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = c.foreground,
                                            selectedTextColor = c.foreground,
                                            indicatorColor = c.accentSoft,
                                            unselectedIconColor = c.mutedForeground,
                                            unselectedTextColor = c.mutedForeground,
                                        ),
                                    )
                                }
                            }
                        },
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                        ) {
                            when (currentTab) {
                                MainTab.DASHBOARD -> DashboardScreen(
                                    state = state,
                                    strings = strings,
                                    onQuickAction = { actionId ->
                                        when (actionId) {
                                            "transfer" -> {
                                                walletInitialTab = WalletTab.TRANSFER
                                                currentTab = MainTab.WALLET
                                            }
                                            "deposit" -> {
                                                walletInitialTab = WalletTab.DEPOSIT
                                                currentTab = MainTab.WALLET
                                            }
                                            "withdraw" -> {
                                                walletInitialTab = WalletTab.WITHDRAW
                                                currentTab = MainTab.WALLET
                                            }
                                            "statement" -> currentTab = MainTab.TRANSACTIONS
                                        }
                                    },
                                    onSelectPeriod = viewModel::selectPeriod,
                                    onOpenTransactions = { currentTab = MainTab.TRANSACTIONS },
                                    onOpenWallet = { currentTab = MainTab.WALLET },
                                )

                                MainTab.WALLET -> WalletScreen(
                                    state = state,
                                    strings = strings,
                                    initialTab = walletInitialTab,
                                    onCreateDeposit = viewModel::createDeposit,
                                    onSendP2P = viewModel::sendP2P,
                                    onSimulateFx = viewModel::simulateConversion,
                                    onExecuteFx = viewModel::executeConversion,
                                    onRequestWithdraw = viewModel::requestWithdraw,
                                    onSaveBeneficiary = viewModel::saveBeneficiary,
                                    onDeleteBeneficiary = viewModel::deleteBeneficiary,
                                )

                                MainTab.TRANSACTIONS -> TransactionsScreen(
                                    state = state,
                                    strings = strings,
                                )

                                MainTab.SETTINGS -> SettingsScreen(
                                    state = state,
                                    strings = strings,
                                    onSaveProfile = viewModel::saveProfile,
                                    onUpdatePref = viewModel::updatePreference,
                                    onTestNotification = viewModel::triggerTestNotification,
                                    onSelectLocale = viewModel::setLocale,
                                    onToggleTheme = viewModel::toggleTheme,
                                    onChangePassword = viewModel::changePassword,
                                    onSetup2FA = viewModel::setup2FA,
                                    onConfirm2FA = viewModel::confirm2FA,
                                    onLogout = viewModel::logout,
                                )
                            }
                        }
                    }

                    // Notifications Modal Sheet
                    if (showNotifications) {
                        ModalBottomSheet(
                            onDismissRequest = { showNotifications = false },
                            containerColor = c.surface,
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 18.dp, vertical = 8.dp),
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = strings.notificationsTitle,
                                        color = c.foreground,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    if (state.unreadCount > 0) {
                                        TextButton(onClick = viewModel::markAllNotificationsRead) {
                                            Text(strings.markAllRead, color = c.brandGold, fontSize = 12.sp)
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                if (state.notifications.isEmpty()) {
                                    Text(
                                        text = strings.noNotifications,
                                        color = c.mutedForeground,
                                        fontSize = 13.sp,
                                        modifier = Modifier.padding(vertical = 24.dp),
                                    )
                                } else {
                                    LazyColumn(
                                        modifier = Modifier.height(320.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp),
                                    ) {
                                        items(state.notifications, key = { it.id }) { item ->
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clip(RoundedCornerShape(14.dp))
                                                    .background(if (item.isRead) c.surfaceSubtle else c.accentSoft)
                                                    .border(
                                                        1.dp,
                                                        if (item.isRead) c.line else c.brandGold.copy(alpha = 0.35f),
                                                        RoundedCornerShape(14.dp),
                                                    )
                                                    .clickable { viewModel.markNotificationRead(item.id) }
                                                    .padding(12.dp),
                                            ) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.Top,
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = item.title,
                                                            color = c.foreground,
                                                            fontSize = 13.sp,
                                                            fontWeight = FontWeight.SemiBold,
                                                        )
                                                        Text(
                                                            text = item.body,
                                                            color = c.mutedForeground,
                                                            fontSize = 12.sp,
                                                            modifier = Modifier.padding(top = 3.dp),
                                                        )
                                                    }
                                                    if (!item.isRead) {
                                                        Icon(
                                                            imageVector = Icons.Outlined.CheckCircle,
                                                            contentDescription = null,
                                                            tint = c.brandGold,
                                                            modifier = Modifier
                                                                .padding(start = 8.dp)
                                                                .size(16.dp),
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TopIconCircle(
    onClick: () -> Unit,
    enabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    val c = PagwaveThemeTokens.colors
    IconButton(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .size(38.dp)
            .clip(CircleShape)
            .background(c.surfaceSubtle)
            .border(1.dp, c.line, CircleShape),
    ) {
        content()
    }
}
